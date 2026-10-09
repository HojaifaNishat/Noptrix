import { z } from "zod";

export const employeeLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("A valid email address is required."),
  password: z.string().min(1, "Password is required."),
});

export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>;
