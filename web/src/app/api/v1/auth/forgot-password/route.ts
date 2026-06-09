import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { initializeMockDb, mockUsers, mockAuditLogs } from "@/utils/mockDb";
import { z } from "zod";

const forgotSchema = z.object({
  email: z.string().email(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();

  const body = await req.json();
  const { email } = forgotSchema.parse(body);

  const user = mockUsers.find((u) => u.email === email);

  // For security, even if user is not found, return success so we don't leak registered emails
  if (user) {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expires = new Date();
    expires.setHours(expires.getHours() + 1);

    user.passwordResetToken = token;
    user.passwordResetExpires = expires.toISOString();

    console.log(`[MOCK PASSWORD RESET] Link for ${email} is: http://localhost:5173/auth?token=${token}`);

    mockAuditLogs.push({
      id: `audit_${Date.now()}`,
      userId: user.id,
      action: "USER_FORGOT_PASSWORD_REQUESTED",
      createdAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
    data: { message: "If that email exists in our system, we've sent a password reset link." },
  });
});
