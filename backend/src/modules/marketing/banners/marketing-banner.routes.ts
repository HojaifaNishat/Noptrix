import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import {
  ownerAuth,
  ownerSecretVerified,
} from "../../../middlewares/ownerAuth.middleware";
import { validate } from "../../../middlewares/validation.middleware";
import {
  MarketingBanner,
  BANNER_STATUSES,
  type IMarketingBanner,
} from "./marketing-banner.model";

const router = Router();

const objectIdSchema = z.object({
  bannerId: z.string().regex(/^[a-f\d]{24}$/i),
});

const bannerBaseSchema = z.object({
  title: z.string().trim().min(2).max(150),
  imageUrl: z.string().url().max(2048),
  mobileImageUrl: z.string().url().max(2048).optional(),
  altText: z.string().trim().max(250).optional(),
  targetUrl: z.string().url().max(2048).optional(),
  placement: z.string().trim().min(1).max(80),
  status: z.enum(BANNER_STATUSES).optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

const createSchema = bannerBaseSchema.refine(
  (value) =>
    !value.startsAt ||
    !value.endsAt ||
    new Date(value.endsAt) > new Date(value.startsAt),
  { message: "endsAt must be after startsAt.", path: ["endsAt"] },
);

const updateSchema = bannerBaseSchema.partial();

router.get("/public", async (_req, res, next) => {
  try {
    const now = new Date();
    const banners = await MarketingBanner.find({
      status: "ACTIVE",
      $and: [
        {
          $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }],
        },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: { $gt: now } }] },
      ],
    })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Active banners retrieved.",
      data: banners,
    });
  } catch (error) {
    next(error);
  }
});

router.use(ownerAuth, ownerSecretVerified);

router.post("/", validate(createSchema), async (req, res, next) => {
  try {
    const actor = req.ownerAuth;
    const banner = await MarketingBanner.create({
      ...req.body,
      startsAt: req.body.startsAt ? new Date(req.body.startsAt) : undefined,
      endsAt: req.body.endsAt ? new Date(req.body.endsAt) : undefined,
      createdBy: actor?.userId,
      updatedBy: actor?.userId,
    });

    res.status(201).json({
      success: true,
      message: "Marketing banner created.",
      data: banner,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/", async (_req, res, next) => {
  try {
    const banners = await MarketingBanner.find()
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();
    res.status(200).json({
      success: true,
      message: "Marketing banners retrieved.",
      data: banners,
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:bannerId",
  validate(objectIdSchema, "params"),
  validate(updateSchema),
  async (req, res, next) => {
    try {
      if (!Types.ObjectId.isValid(String(req.params.bannerId))) {
        res.status(400).json({ success: false, message: "Invalid banner ID." });
        return;
      }

      const update: Partial<IMarketingBanner> = { ...req.body };
      if (update.startsAt) update.startsAt = new Date(update.startsAt);
      if (update.endsAt) update.endsAt = new Date(update.endsAt);
      const actor = req.ownerAuth;
      update.updatedBy = actor?.userId;

      const banner = await MarketingBanner.findByIdAndUpdate(
        req.params.bannerId,
        { $set: update },
        { new: true, runValidators: true },
      );

      if (!banner) {
        res.status(404).json({ success: false, message: "Banner not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Marketing banner updated.",
        data: banner,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:bannerId",
  validate(objectIdSchema, "params"),
  async (req, res, next) => {
    try {
      const banner = await MarketingBanner.findByIdAndDelete(
        req.params.bannerId,
      );

      if (!banner) {
        res.status(404).json({ success: false, message: "Banner not found." });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Marketing banner deleted.",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
