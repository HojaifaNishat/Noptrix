import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  listCoupons,
  updateCoupon,
  validateCoupon,
} from "./coupon.service";
import type {
  CreateCouponInput,
  CouponStatus,
  UpdateCouponInput,
} from "./coupon.types";

const actorId = (req: Request): string | undefined => {
  return req.ownerAuth?.userId ?? req.adminAuth?.adminId;
};

export const createCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await createCoupon(
      req.body as CreateCouponInput,
      actorId(req),
    );
    res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      data,
    });
  },
);

export const listCouponsController = asyncHandler(
  async (req: Request, res: Response) => {
    const status =
      req.query.status === "ACTIVE" || req.query.status === "INACTIVE"
        ? (req.query.status as CouponStatus)
        : undefined;
    const result = await listCoupons({
      page: req.query.page === undefined ? undefined : Number(req.query.page),
      limit:
        req.query.limit === undefined ? undefined : Number(req.query.limit),
      status,
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
    });
    res.status(200).json({
      success: true,
      message: "Coupons retrieved successfully.",
      data: result.items,
      pagination: result.pagination,
    });
  },
);

export const getCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await getCouponById(String(req.params.couponId));
    res.status(200).json({
      success: true,
      message: "Coupon retrieved successfully.",
      data,
    });
  },
);

export const updateCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await updateCoupon(
      String(req.params.couponId),
      req.body as UpdateCouponInput,
      actorId(req),
    );
    res.status(200).json({
      success: true,
      message: "Coupon updated successfully.",
      data,
    });
  },
);

export const deleteCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await deleteCoupon(String(req.params.couponId));
    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully.",
      data,
    });
  },
);

export const validateCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    getAuthenticatedUserId(req);

    const data = await validateCoupon(req.body.code, req.body.subtotal);

    res.status(200).json({
      success: true,
      message: "Coupon validated successfully.",
      data,
    });
  },
);
