import type { Request, Response, NextFunction } from "express";
import {
  createCampaign,
  listCampaigns,
  getCampaign,
  updateCampaign,
  changeCampaignStatus,
  deleteCampaign,
} from "./marketing-campaign.service";
import type { MarketingChannel } from "./marketing-campaign.model";
import { sendMarketingCampaign } from "./marketing-delivery.service";
import {
  createMarketingCampaignSchema,
  marketingCampaignQuerySchema,
  marketingStatusSchema,
  updateMarketingCampaignSchema,
} from "./marketing-campaign.validator";

const actorId = (req: Request): string | undefined => {
  return req.ownerAuth?.userId ?? req.adminAuth?.adminId;
};

const run =
  (handler: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };

export const createCampaignHandler = (channel: MarketingChannel) =>
  run(async (req, res) => {
    const input = createMarketingCampaignSchema.parse(req.body);
    const campaign = await createCampaign(channel, input, actorId(req));
    res.status(201).json({
      success: true,
      message: "Marketing campaign created.",
      data: campaign,
    });
  });

export const listCampaignsHandler = (channel: MarketingChannel) =>
  run(async (req, res) => {
    const query = marketingCampaignQuerySchema.parse(req.query);
    const result = await listCampaigns(channel, query);
    res.status(200).json({
      success: true,
      message: "Marketing campaigns retrieved.",
      data: result.items,
      meta: result.pagination,
    });
  });

export const getCampaignHandler = (channel: MarketingChannel) =>
  run(async (req, res) => {
    const campaign = await getCampaign(channel, String(req.params.campaignId));
    res.status(200).json({
      success: true,
      message: "Marketing campaign retrieved.",
      data: campaign,
    });
  });

export const updateCampaignHandler = (channel: MarketingChannel) =>
  run(async (req, res) => {
    const input = updateMarketingCampaignSchema.parse(req.body);
    const campaign = await updateCampaign(
      channel,
      String(req.params.campaignId),
      input,
      actorId(req),
    );
    res.status(200).json({
      success: true,
      message: "Marketing campaign updated.",
      data: campaign,
    });
  });

export const changeStatusHandler = (channel: MarketingChannel) =>
  run(async (req, res) => {
    const { status } = marketingStatusSchema.parse(req.body);
    const campaign = await changeCampaignStatus(
      channel,
      String(req.params.campaignId),
      status,
      actorId(req),
    );
    res.status(200).json({
      success: true,
      message: "Marketing campaign status updated.",
      data: campaign,
    });
  });

export const deleteCampaignHandler = (channel: MarketingChannel) =>
  run(async (req, res) => {
    await deleteCampaign(channel, String(req.params.campaignId));
    res.status(200).json({
      success: true,
      message: "Marketing campaign deleted.",
      data: null,
    });
  });

export const sendCampaignHandler = (channel: MarketingChannel) =>
  run(async (req, res) => {
    const result = await sendMarketingCampaign(
      channel,
      String(req.params.campaignId),
    );

    res.status(200).json({
      success: true,
      message: "Campaign delivery processing completed.",
      data: result,
    });
  });
