import type { Request, Response } from "express";
import { ApiResponse } from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import {
  createAttribute,
  deleteAttribute,
  getAttributeById,
  getAttributeBySlug,
  listAttributes,
  updateAttribute,
  updateAttributeSortOrder,
  updateAttributeStatus,
} from "./attribute.service";
import type {
  AttributeListQuery,
  CreateAttributeInput,
  UpdateAttributeInput,
} from "./attribute.types";

type IdRequest = Request<{ attributeId: string }>;
type SlugRequest = Request<{ slug: string }>;
type CreateRequest = Request<Record<string, never>, unknown, CreateAttributeInput>;
type UpdateRequest = Request<{ attributeId: string }, unknown, UpdateAttributeInput>;
type StatusRequest = Request<
  { attributeId: string },
  unknown,
  { status: "ACTIVE" | "INACTIVE" }
>;
type SortRequest = Request<
  { attributeId: string },
  unknown,
  { sortOrder: number }
>;

export const createAttributeController = asyncHandler(
  async (req: CreateRequest, res: Response): Promise<void> => {
    const result = await createAttribute({
      ...req.body,
      createdBy: getAuthenticatedAdminId(req),
    });

    res.status(201).json(
      ApiResponse.created(result, "Attribute created successfully.").serialize(),
    );
  },
);

export const getAttributeController = asyncHandler(
  async (req: IdRequest, res: Response): Promise<void> => {
    const result = await getAttributeById(req.params.attributeId);
    res.status(200).json(
      ApiResponse.ok(result, "Attribute retrieved successfully.").serialize(),
    );
  },
);

export const getAttributeBySlugController = asyncHandler(
  async (req: SlugRequest, res: Response): Promise<void> => {
    const result = await getAttributeBySlug(req.params.slug, true);
    res.status(200).json(
      ApiResponse.ok(result, "Attribute retrieved successfully.").serialize(),
    );
  },
);

export const listAttributesController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await listAttributes(req.query as unknown as AttributeListQuery);
    res.status(200).json(
      ApiResponse.ok(result, "Attributes retrieved successfully.").serialize(),
    );
  },
);

export const listActiveAttributesController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await listAttributes(
      req.query as unknown as AttributeListQuery,
      true,
    );
    res.status(200).json(
      ApiResponse.ok(result, "Active attributes retrieved successfully.").serialize(),
    );
  },
);

export const updateAttributeController = asyncHandler(
  async (req: UpdateRequest, res: Response): Promise<void> => {
    const result = await updateAttribute(req.params.attributeId, {
      ...req.body,
      updatedBy: getAuthenticatedAdminId(req),
    });

    res.status(200).json(
      ApiResponse.ok(result, "Attribute updated successfully.").serialize(),
    );
  },
);

export const updateAttributeStatusController = asyncHandler(
  async (req: StatusRequest, res: Response): Promise<void> => {
    const result = await updateAttributeStatus(
      req.params.attributeId,
      req.body.status,
      getAuthenticatedAdminId(req),
    );

    res.status(200).json(
      ApiResponse.ok(result, "Attribute status updated successfully.").serialize(),
    );
  },
);

export const updateAttributeSortOrderController = asyncHandler(
  async (req: SortRequest, res: Response): Promise<void> => {
    const result = await updateAttributeSortOrder(
      req.params.attributeId,
      req.body.sortOrder,
      getAuthenticatedAdminId(req),
    );

    res.status(200).json(
      ApiResponse.ok(result, "Attribute sort order updated successfully.").serialize(),
    );
  },
);

export const deleteAttributeController = asyncHandler(
  async (req: IdRequest, res: Response): Promise<void> => {
    await deleteAttribute(req.params.attributeId);
    res.status(200).json(
      ApiResponse.ok(null, "Attribute deleted successfully.").serialize(),
    );
  },
);
