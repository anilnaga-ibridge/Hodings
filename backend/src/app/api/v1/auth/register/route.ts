import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { registerSchema } from "@/modules/auth/dto/auth.dto";
import { hashPassword } from "@/utils/crypto";
import { AppError } from "@/core/errors/AppError";
import { initializeMockDb, mockUsers, mockProfiles, mockAuditLogs } from "@/utils/mockDb";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  
  const body = await req.json();
  const data = registerSchema.parse(body);

  // Check if email already exists
  const existingUser = mockUsers.find((u) => u.email === data.email);

  if (existingUser) {
    mockAuditLogs.push({
      id: `audit_${Date.now()}`,
      action: "USER_REGISTRATION_FAILED_DUPLICATE",
      payload: { email: data.email },
      createdAt: new Date().toISOString()
    });
    throw new AppError("An account with this email address already exists.", 409, "EMAIL_ALREADY_EXISTS");
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);
  const newUserId = `user_${Date.now()}`;
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`[MOCK EMAIL VERIFICATION] Code for ${data.email} is: ${verificationCode}`);

  // Insert into mock user store
  const newUser = {
    id: newUserId,
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    role: data.role,
    mfaEnabled: false,
    isEmailVerified: false,
    emailVerificationCode: verificationCode,
    createdAt: new Date().toISOString(),
  };
  mockUsers.push(newUser);

  mockAuditLogs.push({
    id: `audit_${Date.now()}`,
    userId: newUserId,
    action: "USER_REGISTRATION_SUCCESS",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: req.headers.get("user-agent") || "Unknown",
    createdAt: new Date().toISOString()
  });

  // Insert into mock profile store
  const newProfile = {
    id: `prof_${Date.now()}`,
    userId: newUserId,
    businessName: null,
    businessTaxId: null,
    address: null,
    notificationPreferences: {
      email: true,
      sms: false,
      push: true,
      whatsapp: false,
    },
    privacySettings: {
      shareAnalytics: true,
    },
  };
  mockProfiles.push(newProfile);

  return NextResponse.json(
    {
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
      },
    },
    { status: 201 }
  );
});
