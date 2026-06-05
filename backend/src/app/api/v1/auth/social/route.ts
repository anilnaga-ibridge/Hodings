import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { signAccessToken, signRefreshToken, setRefreshTokenCookie } from "@/utils/jwt";
import { initializeMockDb, mockUsers, mockProfiles, mockAuditLogs } from "@/utils/mockDb";
import { z } from "zod";

const socialLoginSchema = z.object({
  provider: z.enum(["google", "facebook", "linkedin"]),
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();

  const body = await req.json();
  const data = socialLoginSchema.parse(body);

  let user = mockUsers.find((u) => u.email === data.email);

  if (!user) {
    // Auto register
    const newUserId = `user_${Date.now()}`;
    user = {
      id: newUserId,
      email: data.email,
      passwordHash: "SOCIAL_MOCK_HASH",
      firstName: data.firstName,
      lastName: data.lastName,
      role: "CUSTOMER",
      mfaEnabled: false,
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(user);

    mockProfiles.push({
      id: `prof_${Date.now()}`,
      userId: newUserId,
      businessName: null,
      businessTaxId: null,
      address: null,
      notificationPreferences: { email: true, sms: false, push: true, whatsapp: false },
      privacySettings: { shareAnalytics: true },
    });

    mockAuditLogs.push({
      id: `audit_${Date.now()}`,
      userId: newUserId,
      action: `USER_SOCIAL_REGISTRATION_${data.provider.toUpperCase()}`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Unknown",
      createdAt: new Date().toISOString(),
    });
  } else {
    mockAuditLogs.push({
      id: `audit_${Date.now()}`,
      userId: user.id,
      action: `USER_SOCIAL_LOGIN_${data.provider.toUpperCase()}`,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Unknown",
      createdAt: new Date().toISOString(),
    });
  }

  // Generate tokens
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const response = NextResponse.json({
    success: true,
    data: {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  });

  setRefreshTokenCookie(response, refreshToken);

  return response;
});
