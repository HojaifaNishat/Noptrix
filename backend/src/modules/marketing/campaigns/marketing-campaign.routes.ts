import { Router } from "express";
import {
  ownerAuth,
  ownerSecretVerified,
} from "../../../middlewares/ownerAuth.middleware";
import { validate } from "../../../middlewares/validation.middleware";
import {
  createMarketingCampaignSchema,
  updateMarketingCampaignSchema,
  campaignIdParamSchema,
  marketingCampaignQuerySchema,
  marketingStatusSchema,
} from "./marketing-campaign.validator";
import {
  createCampaignHandler,
  listCampaignsHandler,
  getCampaignHandler,
  updateCampaignHandler,
  changeStatusHandler,
  deleteCampaignHandler,
  sendCampaignHandler,
} from "./marketing-campaign.controller";
import type { MarketingChannel } from "./marketing-campaign.model";

export const createMarketingCampaignRouter = (channel: MarketingChannel) => {
  const router = Router();

  router.use(ownerAuth, ownerSecretVerified);

  router.post(
    "/",
    validate(createMarketingCampaignSchema),
    createCampaignHandler(channel),
  );

  router.get(
    "/",
    validate(marketingCampaignQuerySchema, "query"),
    listCampaignsHandler(channel),
  );

  router.get(
    "/:campaignId",
    validate(campaignIdParamSchema, "params"),
    getCampaignHandler(channel),
  );

  router.patch(
    "/:campaignId",
    validate(campaignIdParamSchema, "params"),
    validate(updateMarketingCampaignSchema),
    updateCampaignHandler(channel),
  );

  router.patch(
    "/:campaignId/status",
    validate(campaignIdParamSchema, "params"),
    validate(marketingStatusSchema),
    changeStatusHandler(channel),
  );

  router.post(
    "/:campaignId/send",
    validate(campaignIdParamSchema, "params"),
    sendCampaignHandler(channel),
  );

  router.delete(
    "/:campaignId",
    validate(campaignIdParamSchema, "params"),
    deleteCampaignHandler(channel),
  );

  return router;
};
