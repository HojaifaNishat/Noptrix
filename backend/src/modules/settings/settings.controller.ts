import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";

import { ApiError } from "../../utils/ApiError";

import {
  getSettingsByCategory,
  getAllSettings,
  updateSettings,
} from "./settings.service";

import { SETTINGS_CATEGORIES, type SettingsCategory } from "./settings.types";
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from "../../services/cloudinary.service";
import { logger } from "../../utils/logger";

/*
|--------------------------------------------------------------------------
| Authenticated Actor
|--------------------------------------------------------------------------
*/

const getActorId = (req: Request): string => {
  const ownerId = req.ownerAuth?.ownerId;

  if (ownerId) {
    return ownerId;
  }

  const adminId = req.adminAuth?.adminId;

  if (adminId) {
    return adminId;
  }

  throw ApiError.unauthorized("Administrative authentication is required.", {
    code: "ADMIN_AUTH_REQUIRED",
  });
};

/*
|--------------------------------------------------------------------------
| Parse Category
|--------------------------------------------------------------------------
*/

const getCategory = (req: Request): SettingsCategory => {
  const category = req.params.category;

  if (
    typeof category !== "string" ||
    !SETTINGS_CATEGORIES.includes(category as SettingsCategory)
  ) {
    throw ApiError.badRequest(
      `Unsupported settings category. Allowed categories: ${SETTINGS_CATEGORIES.join(", ")}.`,
      {
        code: "INVALID_SETTINGS_CATEGORY",
      },
    );
  }

  return category as SettingsCategory;
};

/*
|--------------------------------------------------------------------------
| Get All Settings
|--------------------------------------------------------------------------
|
| GET /api/settings
|
|--------------------------------------------------------------------------
*/

export const getAllSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await getAllSettings();

    res.status(200).json({
      success: true,
      message: "Settings retrieved successfully.",
      data: {
        settings,
      },
    });
  },
);

/*
|--------------------------------------------------------------------------
| Get Settings By Category
|--------------------------------------------------------------------------
|
| GET /api/settings/:category
|
|--------------------------------------------------------------------------
*/

export const getSettingsByCategoryController = asyncHandler(
  async (req: Request, res: Response) => {
    const category = getCategory(req);

    const settings = await getSettingsByCategory(category);

    res.status(200).json({
      success: true,
      message: "Settings retrieved successfully.",
      data: {
        settings,
      },
    });
  },
);

export const getPublicGeneralSettingsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const settings = await getSettingsByCategory("general");

    res.status(200).json({
      success: true,
      message: "Public branding settings retrieved successfully.",
      data: {
        settings: {
          platformName: settings.values.platformName,
          logoUrl: settings.values.logoUrl,
          faviconUrl: settings.values.faviconUrl,
        },
      },
    });
  },
);

type BrandingAssetUrlKey = "logoUrl" | "faviconUrl";
type BrandingAssetPublicIdKey = "logoPublicId" | "faviconPublicId";

const uploadBrandingAsset = async (
  req: Request,
  res: Response,
  options: {
    readonly urlKey: BrandingAssetUrlKey;
    readonly publicIdKey: BrandingAssetPublicIdKey;
    readonly assetName: "logo" | "favicon";
    readonly folder: string;
    readonly transformation: {
      readonly width: number;
      readonly height: number;
      readonly crop: "limit" | "fill";
      readonly quality: "auto";
      readonly fetch_format: "auto" | "png";
    }[];
  },
): Promise<void> => {
  const file = req.file;

  if (!file?.buffer?.length) {
    throw ApiError.badRequest(`A ${options.assetName} image file is required.`, {
      code: `SETTINGS_${options.assetName.toUpperCase()}_FILE_REQUIRED`,
    });
  }

  const actorId = getActorId(req);
  const previousSettings = await getSettingsByCategory("general");
  const previousPublicId = previousSettings.values[options.publicIdKey];
  const uploaded = await uploadBufferToCloudinary(
    {
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
    },
    {
      folder: options.folder,
      resourceType: "image",
      overwrite: false,
      useUniqueFilename: true,
      invalidate: true,
      transformation: options.transformation,
    },
  );

  let settings;

  try {
    settings = await updateSettings({
      category: "general",
      values: {
        [options.urlKey]: uploaded.secureUrl,
        [options.publicIdKey]: uploaded.publicId,
      },
      actorId,
    });
  } catch (error) {
    try {
      await deleteFromCloudinary(uploaded.publicId, "image");
    } catch (cleanupError) {
      logger.error(
        { cleanupError, publicId: uploaded.publicId },
        `Failed to clean up an uncommitted platform ${options.assetName} upload.`,
      );
    }
    throw error;
  }

  if (
    typeof previousPublicId === "string" &&
    previousPublicId &&
    previousPublicId !== uploaded.publicId
  ) {
    try {
      await deleteFromCloudinary(previousPublicId, "image");
    } catch (cleanupError) {
      logger.warn(
        { cleanupError, publicId: previousPublicId },
        `Platform ${options.assetName} updated, but the previous image could not be removed.`,
      );
    }
  }

  res.status(200).json({
    success: true,
    message: `Platform ${options.assetName} updated successfully.`,
    data: { settings },
  });
};

export const uploadSettingsLogoController = asyncHandler(
  async (req: Request, res: Response) => {
    await uploadBrandingAsset(req, res, {
      urlKey: "logoUrl",
      publicIdKey: "logoPublicId",
      assetName: "logo",
      folder: "noptrix/branding",
      transformation: [
        {
          width: 1200,
          height: 600,
          crop: "limit",
          quality: "auto",
          fetch_format: "auto",
        },
      ],
    });
  },
);

export const uploadSettingsFaviconController = asyncHandler(
  async (req: Request, res: Response) => {
    await uploadBrandingAsset(req, res, {
      urlKey: "faviconUrl",
      publicIdKey: "faviconPublicId",
      assetName: "favicon",
      folder: "noptrix/branding/favicons",
      transformation: [
        {
          width: 256,
          height: 256,
          crop: "fill",
          quality: "auto",
          fetch_format: "png",
        },
      ],
    });
  },
);

/*
|--------------------------------------------------------------------------
| Update Settings By Category
|--------------------------------------------------------------------------
|
| PATCH /api/settings/:category
|
|--------------------------------------------------------------------------
*/

export const updateSettingsController = asyncHandler(
  async (req: Request, res: Response) => {
    const category = getCategory(req);

    const actorId = getActorId(req);

    const body = req.body as {
      values: Record<string, unknown>;
    };

    const settings = await updateSettings({
      category,
      values: body.values,
      actorId,
    });

    res.status(200).json({
      success: true,
      message: "Settings updated successfully.",
      data: {
        settings,
      },
    });
  },
);
