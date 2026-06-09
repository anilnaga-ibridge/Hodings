import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { initializeMockDb, mockUsers, mockAuditLogs } from "@/utils/mockDb";
import { z } from "zod";

const mfaSchema = z.object({
  enabled: z.boolean(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const body = await req.json();
  const { enabled } = mfaSchema.parse(body);

  const user = mockUsers.find((u) => u.id === authUser.userId);
  if (!user) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  user.mfaEnabled = enabled;
  if (enabled) {
    user.mfaSecret = "MFA_SECRET_XYZ";
  } else {
    user.mfaSecret = undefined;
  }

  mockAuditLogs.push({
    id: `audit_${Date.now()}`,
    userId: user.id,
    action: enabled ? "USER_MFA_ENABLED" : "USER_MFA_DISABLED",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: req.headers.get("user-agent") || "Unknown",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    data: {
      mfaEnabled: user.mfaEnabled,
      mfaSecret: user.mfaSecret || null,
      message: enabled ? "Multi-factor Authentication enabled." : "Multi-factor Authentication disabled.",
    },
  });
});
