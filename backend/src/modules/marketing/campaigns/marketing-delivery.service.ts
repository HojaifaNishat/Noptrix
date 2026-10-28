import { Types } from "mongoose";
import { User, type UserStatus } from "../../users/user.model";
import {
  MarketingCampaign,
  type MarketingChannel,
} from "./marketing-campaign.model";
import { MarketingConsent } from "../consent/marketing-consent.model";
import { MarketingDevice } from "../devices/marketing-device.model";
import { MarketingDelivery } from "../deliveries/marketing-delivery.model";
import { enqueueEmail } from "../../../jobs/email.job";
import { sendSms } from "../../../services/sms.service";
import { sendPushNotification } from "../../../services/push.service";
import { ApiError } from "../../../utils/ApiError";

type SendableChannel = "EMAIL" | "SMS" | "PUSH";

export const sendMarketingCampaign = async (
  channel: MarketingChannel,
  campaignId: string,
) => {
  if (channel === "GENERAL") {
    throw new ApiError("GENERAL campaigns do not support direct delivery.", {
      statusCode: 400,
    });
  }

  if (!Types.ObjectId.isValid(campaignId)) {
    throw new ApiError("Invalid campaign ID.", { statusCode: 400 });
  }

  // Atomically claim the campaign to prevent concurrent send requests.
  const campaign = await MarketingCampaign.findOneAndUpdate(
    {
      _id: campaignId,
      channel,
      status: { $in: ["READY", "SCHEDULED"] },
      $or: [
        { scheduledAt: { $exists: false } },
        { scheduledAt: null },
        { scheduledAt: { $lte: new Date() } },
      ],
    },
    {
      $set: { status: "SENDING", startedAt: new Date() },
    },
    { new: true },
  );

  if (!campaign) {
    throw new ApiError(
      "Campaign is unavailable, already being sent, or not yet due. Check its status and schedule.",
      { statusCode: 409 },
    );
  }

  const sendChannel = channel as SendableChannel;

  let recipients = 0;
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  try {
    const users = await User.find({
      status: { $in: campaign.audience.userStatuses as UserStatus[] },
      ...(sendChannel === "EMAIL" && campaign.audience.verifiedEmailOnly
        ? { isEmailVerified: true }
        : {}),
      ...(sendChannel === "SMS" && campaign.audience.verifiedPhoneOnly
        ? { isPhoneVerified: true }
        : {}),
      ...(sendChannel === "EMAIL" ? { email: { $exists: true, $ne: "" } } : {}),
      ...(sendChannel === "SMS" ? { phone: { $exists: true, $ne: "" } } : {}),
    })
      .select("_id name email phone isEmailVerified isPhoneVerified")
      .lean();

    const userIds = users.map((user) => user._id);

    const [consents, devices, previousDeliveries] = await Promise.all([
      MarketingConsent.find({
        userId: { $in: userIds },
        channel: sendChannel,
        consented: true,
        unsubscribedAt: { $exists: false },
      }).lean(),
      sendChannel === "PUSH"
        ? MarketingDevice.find({
            userId: { $in: userIds },
            active: true,
          }).lean()
        : Promise.resolve([]),
      MarketingDelivery.find({
        campaignId: campaign._id,
        userId: { $in: userIds },
        channel: sendChannel,
      })
        .select("userId status")
        .lean(),
    ]);

    const consentedIds = new Set(consents.map((item) => String(item.userId)));
    const deliveredIds = new Set(
      previousDeliveries.map((item) => String(item.userId)),
    );

    const tokensByUser = new Map<string, string[]>();
    for (const device of devices) {
      const id = String(device.userId);
      const tokens = tokensByUser.get(id) ?? [];
      tokens.push(device.token);
      tokensByUser.set(id, tokens);
    }

    for (const user of users) {
      const userId = String(user._id);

      if (deliveredIds.has(userId)) {
        skipped++;
        continue;
      }

      if (!consentedIds.has(userId)) {
        skipped++;
        continue;
      }

      if (sendChannel === "EMAIL" && !user.email) {
        skipped++;
        continue;
      }

      if (sendChannel === "SMS" && !user.phone) {
        skipped++;
        continue;
      }

      if (sendChannel === "PUSH" && !tokensByUser.get(userId)?.length) {
        skipped++;
        continue;
      }

      // Reserve the unique delivery key before calling any provider.
      let delivery;
      try {
        delivery = await MarketingDelivery.create({
          campaignId: campaign._id,
          userId: user._id,
          channel: sendChannel,
          status: "SENDING",
          attemptedAt: new Date(),
        });
      } catch (error) {
        if ((error as { code?: number })?.code === 11000) {
          skipped++;
          continue;
        }
        throw error;
      }

      recipients++;

      try {
        if (sendChannel === "EMAIL") {
          const job = await enqueueEmail(
            { email: user.email!, name: user.name },
            campaign.subject!,
            {
              emailId: `marketing-${campaign._id}-${user._id}`,
              text: campaign.message,
              html: campaign.htmlContent,
              metadata: {
                campaignId: String(campaign._id),
                userId,
                channel: "EMAIL",
              },
            },
          );

          await MarketingDelivery.updateOne(
            { _id: delivery._id },
            {
              $set: {
                status: "QUEUED",
                providerMessageId: String(job.id ?? ""),
              },
            },
          );
          successful++;
          continue;
        }

        if (sendChannel === "SMS") {
          const result = await sendSms({
            to: user.phone!,
            message: campaign.message,
          });

          if (!result.success) {
            throw new Error("SMS provider reported an unsuccessful send.");
          }

          await MarketingDelivery.updateOne(
            { _id: delivery._id },
            {
              $set: {
                status: "SENT",
                providerMessageId: result.messageId,
              },
            },
          );
          successful++;
          continue;
        }

        const tokens = [...new Set(tokensByUser.get(userId) ?? [])];
        let sentCount = 0;
        const errors: string[] = [];

        for (const token of tokens) {
          try {
            const result = await sendPushNotification({
              token,
              notification: {
                title: campaign.name,
                body: campaign.message,
              },
              data: {
                campaignId: String(campaign._id),
                type: "marketing",
              },
            });
            if (result.success) sentCount++;
          } catch (error) {
            errors.push(error instanceof Error ? error.message : "Push failed");
          }
        }

        if (sentCount === 0) {
          throw new Error(
            errors.join("; ") || "No push device accepted the message.",
          );
        }

        await MarketingDelivery.updateOne(
          { _id: delivery._id },
          {
            $set: { status: "SENT" },
            ...(errors.length
              ? { $setOnInsert: { error: errors.join("; ").slice(0, 2000) } }
              : {}),
          },
        );
        successful++;
      } catch (error) {
        failed++;
        await MarketingDelivery.updateOne(
          { _id: delivery._id },
          {
            $set: {
              status: "FAILED",
              error: (error instanceof Error
                ? error.message
                : "Delivery failed"
              ).slice(0, 2000),
            },
          },
        );
      }
    }

    campaign.stats = { recipients, successful, failed, skipped };
    campaign.completedAt = new Date();
    campaign.status =
      failed === 0 ? "SENT" : successful > 0 ? "PARTIAL" : "FAILED";
    await campaign.save();

    return {
      campaignId: String(campaign._id),
      channel: sendChannel,
      status: campaign.status,
      stats: { recipients, successful, failed, skipped },
      note:
        sendChannel === "EMAIL"
          ? "Successful means accepted by the email queue, not confirmed inbox delivery."
          : "Results reflect provider acceptance; delivery receipts may require separate provider callbacks.",
    };
  } catch (error) {
    campaign.status = "FAILED";
    campaign.completedAt = new Date();
    campaign.stats = { recipients, successful, failed, skipped };
    await campaign.save();
    throw error;
  }
};
