import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { AppError } from "@/core/errors/AppError";
import { hashPassword } from "@/utils/crypto";
import { initializeMockDb, mockUsers, mockAuditLogs } from "@/utils/mockDb";
import { z } from "zod";

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();

  const body = await req.json();
  const { token, password } = resetSchema.parse(body);

  const user = mockUsers.find((u) => u.passwordResetToken === token);

  if (!user || !user.passwordResetExpires || new Date(user.passwordResetExpires) < new Date()) {
    throw new AppError("Invalid or expired password reset token.", 400, "INVALID_RESET_TOKEN");
  }

  // Update password hash
  user.passwordHash = await hashPassword(password);
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  
  // Clear any login lockouts
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;

  mockAuditLogs.push({
    id: `audit_${Date.now()}`,
    userId: user.id,
    action: "USER_PASSWORD_RESET_SUCCESS",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: req.headers.get("user-agent") || "Unknown",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    data: { message: "Password updated successfully. You can now login with your new password." },
  });
});
