import type { NextFunction, Request, Response } from "express";
import * as service from "./complaint.service";

type AuthRequest = Request & {
  user?: { id?: string; _id?: string; role?: string };
  owner?: { id?: string; _id?: string };
  admin?: { id?: string; _id?: string };
};

function getActorId(req: Request): string {
  const request = req as AuthRequest;
  const id =
    request.user?.id ??
    request.user?._id ??
    request.owner?.id ??
    request.owner?._id ??
    request.admin?.id ??
    request.admin?._id;

  if (!id) {
    const error = new Error("Authenticated user ID not found");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }

  return String(id);
}

function handleError(
  error: unknown,
  next: NextFunction,
  res: Response,
) {
  const statusCode =
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
      ? error.statusCode
      : undefined;

  if (statusCode) {
    res.status(statusCode).json({
      success: false,
      message: error instanceof Error ? error.message : "Request failed",
    });
    return;
  }

  next(error);
}

function routeParam(req: Request, name: string): string {
  const value = req.params[name];

  if (typeof value !== "string" || !value) {
    const error = new Error(`Invalid route parameter: ${name}`);
    Object.assign(error, { statusCode: 400 });
    throw error;
  }

  return value;
}

export async function createComplaint(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const complaint = await service.createComplaint(getActorId(req), req.body);

    res.status(201).json({
      success: true,
      message: "Complaint submitted successfully",
      data: complaint,
    });
  } catch (error) {
    handleError(error, next, res);
  }
}

export async function getMyComplaints(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await service.getMyComplaints(
      getActorId(req),
      req.query as never,
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    handleError(error, next, res);
  }
}

export async function getMyComplaintById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const complaint = await service.getMyComplaintById(
      routeParam(req, "complaintId"),
      getActorId(req),
    );

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    handleError(error, next, res);
  }
}

export async function addCustomerMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const complaint = await service.addCustomerMessage(
      routeParam(req, "complaintId"),
      getActorId(req),
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Reply added successfully",
      data: complaint,
    });
  } catch (error) {
    handleError(error, next, res);
  }
}

export async function getAllComplaints(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await service.getAllComplaints(req.query as never);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    handleError(error, next, res);
  }
}

export async function getComplaintById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const complaint = await service.getComplaintById(
      routeParam(req, "complaintId"),
    );

    res.status(200).json({ success: true, data: complaint });
  } catch (error) {
    handleError(error, next, res);
  }
}

export async function addStaffMessage(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const request = req as AuthRequest;
    const role = request.owner
      ? "OWNER"
      : request.user?.role === "OWNER"
        ? "OWNER"
        : "ADMIN";

    const complaint = await service.addStaffMessage(
      routeParam(req, "complaintId"),
      getActorId(req),
      role,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Staff reply added successfully",
      data: complaint,
    });
  } catch (error) {
    handleError(error, next, res);
  }
}

export async function updateComplaint(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const complaint = await service.updateComplaint(
      routeParam(req, "complaintId"),
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Complaint updated successfully",
      data: complaint,
    });
  } catch (error) {
    handleError(error, next, res);
  }
}

export async function deleteComplaint(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await service.deleteComplaint(
      routeParam(req, "complaintId"),
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    handleError(error, next, res);
  }
}
