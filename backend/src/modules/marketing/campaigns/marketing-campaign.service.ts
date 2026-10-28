import { Types } from "mongoose";
import {
  MarketingCampaign,
  type MarketingChannel,
} from "./marketing-campaign.model";
import { ApiError } from "../../../utils/ApiError";

interface CampaignInput {
  name?: string;
  description?: string;
  subject?: string;
  message?: string;
  htmlContent?: string;
  scheduledAt?: string;
  audience?: {
    userStatuses?: string[];
    verifiedEmailOnly?: boolean;
    verifiedPhoneOnly?: boolean;
  };
}

interface ListQuery {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const createCampaign = async (
  channel: MarketingChannel,
  input: CampaignInput,
  actorId?: string,
) => {
  if (
    (channel === "EMAIL" || channel === "SMS" || channel === "PUSH") &&
    !input.message?.trim()
  ) {
    throw new ApiError("Campaign message is required.", { statusCode: 400 });
  }

  if (channel === "EMAIL" && !input.subject?.trim()) {
    throw new ApiError("Email campaigns require a subject.", {
      statusCode: 400,
    });
  }

  if (input.scheduledAt && new Date(input.scheduledAt) <= new Date()) {
    throw new ApiError("Scheduled time must be in the future.", {
      statusCode: 400,
    });
  }

  return MarketingCampaign.create({
    name: input.name,
    description: input.description,
    channel,
    status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
    subject: input.subject,
    message: input.message,
    htmlContent: input.htmlContent,
    audience: {
      userStatuses: input.audience?.userStatuses ?? ["ACTIVE"],
      verifiedEmailOnly: input.audience?.verifiedEmailOnly ?? true,
      verifiedPhoneOnly: input.audience?.verifiedPhoneOnly ?? true,
    },
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
    createdBy: actorId,
    updatedBy: actorId,
  });
};

export const listCampaigns = async (
  channel: MarketingChannel,
  query: ListQuery,
) => {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const filter: Record<string, unknown> = { channel };

  if (query.status) filter.status = query.status;

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    MarketingCampaign.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    MarketingCampaign.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getCampaign = async (
  channel: MarketingChannel,
  campaignId: string,
) => {
  if (!Types.ObjectId.isValid(campaignId)) {
    throw new ApiError("Invalid campaign ID.", { statusCode: 400 });
  }

  const campaign = await MarketingCampaign.findOne({
    _id: campaignId,
    channel,
  });

  if (!campaign) {
    throw new ApiError("Marketing campaign not found.", { statusCode: 404 });
  }

  return campaign;
};

export const updateCampaign = async (
  channel: MarketingChannel,
  campaignId: string,
  input: CampaignInput,
  actorId?: string,
) => {
  const campaign = await getCampaign(channel, campaignId);

  if (!["DRAFT", "SCHEDULED", "PAUSED"].includes(campaign.status)) {
    throw new ApiError(
      "Only draft, scheduled, or paused campaigns can be edited.",
      { statusCode: 409 },
    );
  }

  if (input.scheduledAt && new Date(input.scheduledAt) <= new Date()) {
    throw new ApiError("Scheduled time must be in the future.", {
      statusCode: 400,
    });
  }

  const update: Record<string, unknown> = {
    ...input,
    updatedBy: actorId,
  };

  if (input.scheduledAt) {
    update.scheduledAt = new Date(input.scheduledAt);
    update.status = "SCHEDULED";
  }

  if (input.audience) {
    update.audience = {
      ...campaign.audience,
      ...input.audience,
    };
  }

  Object.assign(campaign, update);
  await campaign.save();

  return campaign;
};

export const changeCampaignStatus = async (
  channel: MarketingChannel,
  campaignId: string,
  status: "DRAFT" | "READY" | "PAUSED" | "ARCHIVED",
  actorId?: string,
) => {
  const campaign = await getCampaign(channel, campaignId);

  if (["SENT", "SENDING", "PARTIAL"].includes(campaign.status)) {
    throw new ApiError(
      "This campaign can no longer be changed to that status.",
      { statusCode: 409 },
    );
  }

  if (
    status === "READY" &&
    campaign.scheduledAt &&
    campaign.scheduledAt <= new Date()
  ) {
    throw new ApiError(
      "The scheduled time has passed; update the schedule first.",
      { statusCode: 400 },
    );
  }

  campaign.status = status;
  campaign.updatedBy = actorId;
  await campaign.save();

  return campaign;
};

export const deleteCampaign = async (
  channel: MarketingChannel,
  campaignId: string,
) => {
  const campaign = await getCampaign(channel, campaignId);

  if (["SENDING", "SENT", "PARTIAL"].includes(campaign.status)) {
    throw new ApiError("A sending or completed campaign cannot be deleted.", {
      statusCode: 409,
    });
  }

  await campaign.deleteOne();
};
