import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";

import {
  archiveProduct,
  createProduct,
  getProductById,
  getProductBySlug,
  listProducts,
  updateProduct,
  updateProductStatus,
} from "./product.service";

import type { ProductListQuery } from "./product.types";

function getActorId(req: Request): string | undefined {
  return req.adminAuth?.adminId;
}

function getParam(value: string | string[] | undefined, name: string): string {
  const result = Array.isArray(value) ? value[0] : value;

  if (typeof result !== "string" || !result.length) {
    throw new Error(`Missing or invalid route parameter: ${name}`);
  }

  return result;
}

function getListQuery(req: Request): ProductListQuery {
  const query = req.query as unknown as ProductListQuery & {
    featured?: boolean | string;
    inStock?: boolean | string;
  };

  const parseBoolean = (
    value: boolean | string | undefined,
  ): boolean | undefined => {
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return undefined;
  };

  return {
    ...query,
    featured: parseBoolean(query.featured),
    inStock: parseBoolean(query.inStock),
  };
}

export const createProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await createProduct(req.body, getActorId(req));

    res
      .status(201)
      .json(
        ApiResponse.created(
          product,
          "Product created successfully.",
        ).serialize(),
      );
  },
);

export const listProductsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await listProducts(getListQuery(req));

    res
      .status(200)
      .json(
        ApiResponse.ok(result, "Products fetched successfully.").serialize(),
      );
  },
);

export const listPublicProductsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await listProducts(getListQuery(req), {
      publicOnly: true,
    });

    res
      .status(200)
      .json(
        ApiResponse.ok(result, "Products fetched successfully.").serialize(),
      );
  },
);

export const getProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await getProductById(getParam(req.params.id, "id"));

    res
      .status(200)
      .json(
        ApiResponse.ok(product, "Product fetched successfully.").serialize(),
      );
  },
);

export const getProductBySlugController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await getProductBySlug(getParam(req.params.slug, "slug"));

    res
      .status(200)
      .json(
        ApiResponse.ok(product, "Product fetched successfully.").serialize(),
      );
  },
);

export const updateProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await updateProduct(
      getParam(req.params.id, "id"),
      req.body,
      getActorId(req),
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(product, "Product updated successfully.").serialize(),
      );
  },
);

export const updateProductStatusController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await updateProductStatus(
      getParam(req.params.id, "id"),
      req.body.status,
      getActorId(req),
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(
          product,
          "Product status updated successfully.",
        ).serialize(),
      );
  },
);

export const archiveProductController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const product = await archiveProduct(
      getParam(req.params.id, "id"),
      getActorId(req),
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(product, "Product archived successfully.").serialize(),
      );
  },
);
