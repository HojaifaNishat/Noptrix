import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";

import {
  addCartItem,
  clearCart,
  getCart,
  refreshCartPrices,
  removeCartItem,
  removeCartProduct,
  updateCartItem,
} from "./cart.service";

function getUserId(req: Request): string {
  return getAuthenticatedUserId(req);
}

export const getCartController = asyncHandler(
  async (req: Request, res: Response) => {
    const cart = await getCart(getUserId(req));

    res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      data: cart,
    });
  },
);

export const addCartItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const cart = await addCartItem(getUserId(req), req.body);

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully",
      data: cart,
    });
  },
);

export const updateCartItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const { itemId } = req.params;

    if (typeof itemId !== "string") {
      throw new Error("Invalid cart item ID");
    }

    const cart = await updateCartItem(
      getUserId(req),
      itemId,
      req.body.quantity,
    );

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully",
      data: cart,
    });
  },
);

export const removeCartItemController = asyncHandler(
  async (req: Request, res: Response) => {
    const { itemId } = req.params;

    if (typeof itemId !== "string") {
      throw new Error("Invalid cart item ID");
    }

    const cart = await removeCartItem(getUserId(req), itemId);

    res.status(200).json({
      success: true,
      message: "Cart item removed successfully",
      data: cart,
    });
  },
);

export const removeCartProductController = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId, variantId } = req.params;

    if (
      typeof productId !== "string" ||
      (variantId !== undefined && typeof variantId !== "string")
    ) {
      throw new Error("Invalid product or variant ID");
    }

    const cart = await removeCartProduct(getUserId(req), productId, variantId);

    res.status(200).json({
      success: true,
      message: "Product removed from cart successfully",
      data: cart,
    });
  },
);

export const clearCartController = asyncHandler(
  async (req: Request, res: Response) => {
    const cart = await clearCart(getUserId(req));

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
      data: cart,
    });
  },
);

export const refreshCartPricesController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await refreshCartPrices(getUserId(req));

    res.status(200).json({
      success: true,
      message: "Cart prices refreshed successfully",
      data: result,
    });
  },
);
