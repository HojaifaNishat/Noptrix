import type { Request, RequestHandler } from "express";

import { ApiError } from "../../utils/ApiError";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";

import {
  createVariant,
  deleteVariant,
  getVariant,
  listVariants,
  updateVariant,
} from "./variant.service";

function getParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || value.length === 0) {
    throw ApiError.badRequest(`Invalid or missing route parameter: ${name}.`);
  }

  return value;
}

function getActor(req: Request) {
  const adminId = req.adminAuth?.adminId;

  if (!adminId) {
    throw ApiError.unauthorized("Authenticated administrator ID is missing.");
  }

  return { userId: adminId };
}

export const createVariantController: RequestHandler = asyncHandler(
  async (req, res) => {
    const result = await createVariant(
      getParam(req, "productId"),
      req.body,
      getActor(req),
    );

    res.status(201).json(
      ApiResponse.created(
        result,
        "Product variant created successfully.",
      ).serialize(),
    );
  },
);

export const listVariantsController: RequestHandler = asyncHandler(
  async (req, res) => {
    const result = await listVariants(
      getParam(req, "productId"),
      req.query as never,
    );

    res.status(200).json(
      ApiResponse.ok(
        result,
        "Product variants fetched successfully.",
      ).serialize(),
    );
  },
);

export const getVariantController: RequestHandler = asyncHandler(
  async (req, res) => {
    const result = await getVariant(
      getParam(req, "productId"),
      getParam(req, "id"),
    );

    res.status(200).json(
      ApiResponse.ok(
        result,
        "Product variant fetched successfully.",
      ).serialize(),
    );
  },
);

export const updateVariantController: RequestHandler = asyncHandler(
  async (req, res) => {
    const result = await updateVariant(
      getParam(req, "productId"),
      getParam(req, "id"),
      req.body,
      getActor(req),
    );

    res.status(200).json(
      ApiResponse.ok(
        result,
        "Product variant updated successfully.",
      ).serialize(),
    );
  },
);

export const deleteVariantController: RequestHandler = asyncHandler(
  async (req, res) => {
    const result = await deleteVariant(
      getParam(req, "productId"),
      getParam(req, "id"),
    );

    res.status(200).json(
      ApiResponse.ok(
        result,
        "Product variant deleted successfully.",
      ).serialize(),
    );
  },
);
