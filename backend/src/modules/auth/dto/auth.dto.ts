import { z } from "zod";
import { UserRole } from "@prisma/client";

export const registerSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
  password: z.string().min(1, { message: "Password is required" }),
  mfaToken: z.string().length(6).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "Token is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters long" }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email format" }),
});
