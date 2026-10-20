import type { Request, Response } from "express";

import { getAuthenticatedUserId } from "../../middlewares/userAuth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

import * as addressService from "./address.service";

export const createAddressController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);

    const address = await addressService.createAddress(
      userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Address created successfully",
      data: address,
    });
  },
);

export const listAddressesController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);

    const result = await addressService.listAddresses(
      userId,
      req.query as never,
    );

    res.status(200).json({
      success: true,
      message: "Addresses retrieved successfully",
      data: result.addresses,
      pagination: result.pagination,
    });
  },
);

export const getAddressController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new Error("Invalid address ID");
    }

    const address = await addressService.getAddressById(
      userId,
      id,
    );

    res.status(200).json({
      success: true,
      message: "Address retrieved successfully",
      data: address,
    });
  },
);

export const getDefaultAddressController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);

    const address = await addressService.getDefaultAddress(userId);

    res.status(200).json({
      success: true,
      message: "Default address retrieved successfully",
      data: address,
    });
  },
);

export const updateAddressController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new Error("Invalid address ID");
    }

    const address = await addressService.updateAddress(
      userId,
      id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: address,
    });
  },
);

export const setDefaultAddressController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new Error("Invalid address ID");
    }

    const address = await addressService.setDefaultAddress(
      userId,
      id,
    );

    res.status(200).json({
      success: true,
      message: "Default address updated successfully",
      data: address,
    });
  },
);

export const deleteAddressController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getAuthenticatedUserId(req);
    const id = req.params.id;
    if (typeof id !== "string") {
      throw new Error("Invalid address ID");
    }

    const result = await addressService.deleteAddress(
      userId,
      id,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  },
);
