import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import {
  acceptAdminInvitation,
  createAdminInvitation,
  getAdminInvitationByToken,
  requestAdminInvitationOtp,
} from "./admin-invitation.service";
import { Role } from "../roles/role.model";

export const createAdminInvitationController = asyncHandler(
  async (req: Request, res: Response) => {
    const invitedBy = req.ownerAuth?.userId;
    if (!invitedBy) {
      res.status(401).json({
        success: false,
        message: "Owner authentication required.",
      });
      return;
    }

    const invitation = await createAdminInvitation({
      employeeId: req.body.employeeId,
      roleId: req.body.roleId,
      invitedBy,
    });
    res.status(201).json({
      success: true,
      message: "Admin invitation sent successfully.",
      data: invitation,
    });
  },
);

export const validateAdminInvitationController = asyncHandler(
  async (req: Request, res: Response) => {
    const invitation = await getAdminInvitationByToken(
      String(req.query.token ?? ""),
    );
    const role = await Role.findById(invitation.roleId)
      .select("name slug")
      .lean()
      .exec();

    res.status(200).json({
      success: true,
      message: "Admin invitation retrieved successfully.",
      data: {
        name: invitation.name,
        email: invitation.email,
        role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  },
);

export const requestAdminInvitationOtpController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await requestAdminInvitationOtp(
      req.body.token,
      req.body.channel,
    );
    res.status(200).json({
      success: true,
      message: "Verification code sent successfully.",
      data: result,
    });
  },
);

export const acceptAdminInvitationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await acceptAdminInvitation(req.body);
    res.status(200).json({
      success: true,
      message: "Admin account setup completed successfully.",
      data: result,
    });
  },
);
