import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";
import { getAuthenticatedSellerId } from "../../middlewares/sellerAuth.middleware";
import {
  createSellerProduct,
  listSellerProducts,
  getSellerProduct,
  updateSellerProduct,
  archiveSellerProduct,
  resubmitSellerProduct,
  listPendingSellerProducts,
  reviewSellerProduct,
} from "./seller-product.service";
import type {
  SellerProductCreateInput,
  SellerProductUpdateInput,
  SellerProductListQuery,
} from "./seller-product.types";

type ReviewAuthRequest = Request & {
  ownerAuth?: { ownerId?: string };
  adminAuth?: { adminId?: string; userId?: string };
};

function getReviewerId(req: Request): string {
  const auth = req as ReviewAuthRequest;
  return String(
    auth.ownerAuth?.ownerId ??
      auth.adminAuth?.adminId ??
      auth.adminAuth?.userId ??
      "",
  );
}

export const createSellerProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await createSellerProduct(
      getAuthenticatedSellerId(req),
      req.body as SellerProductCreateInput,
    );

    res
      .status(201)
      .json(
        ApiResponse.created(
          result,
          "Product submitted for review.",
        ).serialize(),
      );
  },
);

export const listSellerProductsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await listSellerProducts(
      getAuthenticatedSellerId(req),
      req.query as unknown as SellerProductListQuery,
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result.products,
          "Seller products retrieved.",
          result.pagination,
        ).serialize(),
      );
  },
);

export const getSellerProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await getSellerProduct(
      getAuthenticatedSellerId(req),
      String(req.params.id),
    );

    res
      .status(200)
      .json(ApiResponse.ok(result, "Seller product retrieved.").serialize());
  },
);

export const updateSellerProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await updateSellerProduct(
      getAuthenticatedSellerId(req),
      String(req.params.id),
      req.body as SellerProductUpdateInput,
    );

    res
      .status(200)
      .json(ApiResponse.ok(result, "Seller product updated.").serialize());
  },
);

export const archiveSellerProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await archiveSellerProduct(
      getAuthenticatedSellerId(req),
      String(req.params.id),
    );

    res
      .status(200)
      .json(ApiResponse.ok(product, "Product archived.").serialize());
  },
);

export const resubmitSellerProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await resubmitSellerProduct(
      getAuthenticatedSellerId(req),
      String(req.params.id),
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(result, "Product resubmitted for review.").serialize(),
      );
  },
);

export const listPendingSellerProductsController = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    const submissions = await listPendingSellerProducts();

    res
      .status(200)
      .json(
        ApiResponse.ok(
          submissions,
          "Pending seller submissions retrieved.",
        ).serialize(),
      );
  },
);

export const reviewSellerProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const body = req.body as {
      decision: "APPROVED" | "REJECTED";
      rejectionReason?: string;
    };

    const result = await reviewSellerProduct(
      String(req.params.id),
      body.decision,
      getReviewerId(req),
      body.rejectionReason,
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result,
          `Seller product ${body.decision.toLowerCase()}.`,
        ).serialize(),
      );
  },
);
