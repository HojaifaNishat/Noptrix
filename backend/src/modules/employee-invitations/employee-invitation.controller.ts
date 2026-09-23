import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedAdminId } from "../../middlewares/adminAuth.middleware";
import { acceptEmployeeInvitation, createEmployeeInvitation } from "./employee-invitation.service";
import type { AcceptEmployeeInvitationInput, CreateEmployeeInvitationInput } from "./employee-invitation.validator";

export const createEmployeeInvitationController = asyncHandler(async (req: Request, res: Response) => {
    const result = await createEmployeeInvitation(
        req.body as CreateEmployeeInvitationInput,
        getAuthenticatedAdminId(req)
    );
    res.status(201).json({ success: true, message: "Employee invitation created successfully.", data: result });
});

export const acceptEmployeeInvitationController = asyncHandler(async (req: Request, res: Response) => {
    const employee = await acceptEmployeeInvitation(req.body as AcceptEmployeeInvitationInput);
    res.status(201).json({
        success: true,
        message: "Employee invitation accepted successfully.",
        data: { employeeId: employee._id, userId: employee.userId, roleId: employee.roleId },
    });
});