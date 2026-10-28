import type { Request, Response } from "express";

import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

import {
  addWishlistItem,
  archiveWishlist,
  clearWishlist,
  createWishlist,
  deleteWishlist,
  getOrCreateDefaultWishlist,
  getWishlist,
  listWishlists,
  removeWishlistItem,
  removeWishlistProduct,
  setDefaultWishlist,
  updateWishlist,
} from "./wishlist.service";

function userId(req: Request): string {
  return getAuthenticatedUserId(req);
}

function routeParam(req: Request, key: string): string {
  const value = req.params[key];

  if (typeof value !== "string") {
    throw new Error(`Invalid ${key}`);
  }

  return value;
}

export const createWishlistController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await createWishlist(userId(req), req.body);

    res.status(201).json({
      success: true,
      message: "Wishlist created successfully",
      data: wishlist,
    });
  },
);

export const getOrCreateDefaultWishlistController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await getOrCreateDefaultWishlist(userId(req));

    res.status(200).json({
      success: true,
      message: "Default wishlist retrieved successfully",
      data: wishlist,
    });
  },
);

export const listWishlistsController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await listWishlists(userId(req), req.query as never);

    res.status(200).json({
      success: true,
      message: "Wishlists retrieved successfully",
      data: result,
    });
  },
);

export const getWishlistController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await getWishlist(
      userId(req),
      routeParam(req, "wishlistId"),
    );

    res.status(200).json({
      success: true,
      message: "Wishlist retrieved successfully",
      data: wishlist,
    });
  },
);

export const updateWishlistController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await updateWishlist(
      userId(req),
      routeParam(req, "wishlistId"),
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Wishlist updated successfully",
      data: wishlist,
    });
  },
);

export const deleteWishlistController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await deleteWishlist(
      userId(req),
      routeParam(req, "wishlistId"),
    );

    res.status(200).json({
      success: true,
      message: "Wishlist deleted successfully",
      data: result,
    });
  },
);

export const addWishlistItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await addWishlistItem(
      userId(req),
      routeParam(req, "wishlistId"),
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Item added to wishlist successfully",
      data: wishlist,
    });
  },
);

export const removeWishlistItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await removeWishlistItem(
      userId(req),
      routeParam(req, "wishlistId"),
      routeParam(req, "itemId"),
    );

    res.status(200).json({
      success: true,
      message: "Item removed from wishlist successfully",
      data: wishlist,
    });
  },
);

export const removeWishlistProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await removeWishlistProduct(
      userId(req),
      routeParam(req, "wishlistId"),
      routeParam(req, "productId"),
      typeof req.params.variantId === "string"
        ? req.params.variantId
        : undefined,
    );

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully",
      data: wishlist,
    });
  },
);

export const clearWishlistController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await clearWishlist(
      userId(req),
      routeParam(req, "wishlistId"),
    );

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      data: wishlist,
    });
  },
);

export const archiveWishlistController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await archiveWishlist(
      userId(req),
      routeParam(req, "wishlistId"),
    );

    res.status(200).json({
      success: true,
      message: "Wishlist archived successfully",
      data: wishlist,
    });
  },
);

export const setDefaultWishlistController = asyncHandler(
  async (req: Request, res: Response) => {
    const wishlist = await setDefaultWishlist(
      userId(req),
      routeParam(req, "wishlistId"),
    );

    res.status(200).json({
      success: true,
      message: "Default wishlist updated successfully",
      data: wishlist,
    });
  },
);
