import { z } from "zod";

export const employeeLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email address is required."),
  password: z.string().min(1, "Password is required."),
});

export const employeeLoginVerificationSchema = z.object({
  challengeId: z.string().regex(/^[a-f0-9]{64}$/i),
  code: z.string().trim().regex(/^\d{6}$/, "Verification code must be exactly 6 digits."),
});

export const resendEmployeeLoginVerificationSchema = z.object({
  challengeId: z.string().regex(/^[a-f0-9]{64}$/i),
});

export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>;
