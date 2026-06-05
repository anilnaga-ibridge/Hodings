import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { AppError } from "@/core/errors/AppError";
import { initializeMockDb, mockUsers, mockAuditLogs } from "@/utils/mockDb";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();

  const body = await req.json();
  const { email, code } = verifySchema.parse(body);

  const user = mockUsers.find((u) => u.email === email);
  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  if (user.emailVerificationCode !== code) {
    mockAuditLogs.push({
      id: `audit_${Date.now()}`,
      userId: user.id,
      action: "EMAIL_VERIFICATION_FAILED_BAD_CODE",
      createdAt: new Date().toISOString(),
    });
    throw new AppError("Invalid verification code.", 400, "INVALID_VERIFICATION_CODE");
  }

  user.isEmailVerified = true;
  user.emailVerificationCode = null;

  mockAuditLogs.push({
    id: `audit_${Date.now()}`,
    userId: user.id,
    action: "EMAIL_VERIFICATION_SUCCESS",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: req.headers.get("user-agent") || "Unknown",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    data: { message: "Email verified successfully." },
  });
});
