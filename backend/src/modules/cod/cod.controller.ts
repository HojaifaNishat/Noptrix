import type { Request, Response, NextFunction } from "express";

import {
  collectCOD,
  createCOD,
  getAllCODRecords,
  getCODById,
  getCODByOrder,
  getMyCODRecords,
  remitCOD,
  reverseCOD,
} from "./cod.service";

function sendError(error: unknown, res: Response, next: NextFunction) {
  if (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  next(error);
}

function getRouteParam(
  value: string | string[] | undefined,
  name: string,
): string {
  if (typeof value !== "string" || !value) {
    const error = new Error(`Invalid route parameter: ${name}`);
    Object.assign(error, { statusCode: 400 });
    throw error;
  }

  return value;
}

function actorUserId(req: Request): string {
  const auth = req as Request & {
    riderAuth?: { riderId?: string };
    user?: { id?: string; _id?: string };
  };

  const id = auth.riderAuth?.riderId ?? auth.user?.id ?? auth.user?._id;

  if (typeof id !== "string" || !id) {
    const error = new Error("Authenticated user ID is unavailable.");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }

  return id;
}

export async function createCODController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await createCOD(req.body, actorUserId(req));

    res.status(201).json({
      success: true,
      message: "COD record created.",
      data,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function collectCODController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await collectCOD(
      getRouteParam(req.params.codId, "codId"),
      actorUserId(req),
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "COD collection recorded.",
      data,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function remitCODController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await remitCOD(
      getRouteParam(req.params.codId, "codId"),
      actorUserId(req),
    );

    res.status(200).json({
      success: true,
      message: "COD remittance recorded.",
      data,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function reverseCODController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await reverseCOD(
      getRouteParam(req.params.codId, "codId"),
      actorUserId(req),
      req.body.notes,
    );

    res.status(200).json({
      success: true,
      message: "COD record reversed.",
      data,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function getCODController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getCODById(getRouteParam(req.params.codId, "codId"));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function getCODByOrderController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getCODByOrder(
      getRouteParam(req.params.orderId, "orderId"),
    );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function getMyCODController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getMyCODRecords(actorUserId(req), req.query as never);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}

export async function getAllCODController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = await getAllCODRecords(req.query as never);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    sendError(error, res, next);
  }
}
