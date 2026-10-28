import type { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { ApiResponse } from "../../utils/ApiResponse";

import {
  addProductsToCollection,
  createCollection,
  deleteCollection,
  getCollectionById,
  getCollectionBySlug,
  listCollections,
  removeProductsFromCollection,
  updateCollection,
} from "./collection.service";

import type {
  ICollectionFilters,
  ICreateCollectionInput,
  IUpdateCollectionInput,
} from "./collection.types";

function getStringParam(
  value: string | string[] | undefined,
  name: string,
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid route parameter: ${name}`);
  }

  return value;
}

export const createCollectionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const collection = await createCollection(
      req.body as ICreateCollectionInput,
    );

    res
      .status(201)
      .json(
        ApiResponse.created(
          collection,
          "Collection created successfully.",
        ).serialize(),
      );
  },
);

export const listPublicCollectionsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const filters = req.query as unknown as ICollectionFilters;

    const result = await listCollections(filters, {
      publicOnly: true,
    });

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result,
          "Collections retrieved successfully.",
        ).serialize(),
      );
  },
);

export const listAdminCollectionsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const filters = req.query as unknown as ICollectionFilters;
    const result = await listCollections(filters);

    res
      .status(200)
      .json(
        ApiResponse.ok(
          result,
          "Collections retrieved successfully.",
        ).serialize(),
      );
  },
);

export const getCollectionByIdController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = getStringParam(req.params.id, "id");
    const collection = await getCollectionById(id);

    res
      .status(200)
      .json(
        ApiResponse.ok(
          collection,
          "Collection retrieved successfully.",
        ).serialize(),
      );
  },
);

export const getPublicCollectionBySlugController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const slug = getStringParam(req.params.slug, "slug");
    const collection = await getCollectionBySlug(slug);

    res
      .status(200)
      .json(
        ApiResponse.ok(
          collection,
          "Collection retrieved successfully.",
        ).serialize(),
      );
  },
);

export const updateCollectionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = getStringParam(req.params.id, "id");

    const collection = await updateCollection(
      id,
      req.body as IUpdateCollectionInput,
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(
          collection,
          "Collection updated successfully.",
        ).serialize(),
      );
  },
);

export const addCollectionProductsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = getStringParam(req.params.id, "id");

    const collection = await addProductsToCollection(
      id,
      req.body.productIds as string[],
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(
          collection,
          "Products added to collection successfully.",
        ).serialize(),
      );
  },
);

export const removeCollectionProductsController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = getStringParam(req.params.id, "id");

    const collection = await removeProductsFromCollection(
      id,
      req.body.productIds as string[],
    );

    res
      .status(200)
      .json(
        ApiResponse.ok(
          collection,
          "Products removed from collection successfully.",
        ).serialize(),
      );
  },
);

export const deleteCollectionController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = getStringParam(req.params.id, "id");
    const result = await deleteCollection(id);

    res
      .status(200)
      .json(
        ApiResponse.ok(result, "Collection deleted successfully.").serialize(),
      );
  },
);
