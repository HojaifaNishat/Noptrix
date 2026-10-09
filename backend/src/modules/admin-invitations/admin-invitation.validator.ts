import { z } from "zod";

const objectIdSchema = z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId.");

export const createAdminInvitationSchema = z.object({
    employeeId: objectIdSchema,
    roleId: objectIdSchema,
}).strict();

export const adminInvitationTokenSchema = z.object({
    token: z.string().trim().min(1, "Invitation token is required."),
});

export const requestAdminInvitationOtpSchema = z.object({
    token: z.string().trim().min(1, "Invitation token is required."),
    channel: z.enum(["EMAIL", "PHONE"]),
}).strict();

export const acceptAdminInvitationSchema = z.object({
    token: z.string().trim().min(1, "Invitation token is required."),
    channel: z.enum(["EMAIL", "PHONE"]),
    code: z.string().trim().regex(/^\d{6}$/, "Verification code must be exactly 6 digits."),
    password: z.string().min(8).max(128),
}).strict();
