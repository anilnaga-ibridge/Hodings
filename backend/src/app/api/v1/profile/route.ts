import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { clearRefreshTokenCookie } from "@/utils/jwt";
import { initializeMockDb, mockUsers, mockProfiles, mockAuditLogs } from "@/utils/mockDb";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  businessName: z.string().nullable().optional(),
  businessTaxId: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  billingDetails: z.any().optional(),
  logoUrl: z.string().nullable().optional(),
  notificationPreferences: z.any().optional(),
  privacySettings: z.any().optional(),
});

// GET /api/v1/profile
export const GET = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const user = mockUsers.find((u) => u.id === authUser.userId);
  const profile = mockProfiles.find((p) => p.userId === authUser.userId);

  if (!user) {
    throw new AppError("Profile not found.", 404, "PROFILE_NOT_FOUND");
  }

  return NextResponse.json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      profile: profile || null,
    },
  });
});

// PUT /api/v1/profile
export const PUT = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);
  const body = await req.json();
  const data = updateProfileSchema.parse(body);

  const userIdx = mockUsers.findIndex((u) => u.id === authUser.userId);
  const profileIdx = mockProfiles.findIndex((p) => p.userId === authUser.userId);

  if (userIdx === -1) {
    throw new AppError("User not found.", 404, "USER_NOT_FOUND");
  }

  // Update mock user root fields
  if (data.firstName !== undefined) mockUsers[userIdx].firstName = data.firstName;
  if (data.lastName !== undefined) mockUsers[userIdx].lastName = data.lastName;
  if (data.phone !== undefined) mockUsers[userIdx].phone = data.phone;

  // Update mock profile fields
  if (profileIdx !== -1) {
    const prof = mockProfiles[profileIdx];
    if (data.businessName !== undefined) prof.businessName = data.businessName;
    if (data.businessTaxId !== undefined) prof.businessTaxId = data.businessTaxId;
    if (data.address !== undefined) prof.address = data.address;
    if (data.billingDetails !== undefined) prof.billingDetails = data.billingDetails;
    if (data.logoUrl !== undefined) prof.logoUrl = data.logoUrl;
    if (data.notificationPreferences !== undefined) prof.notificationPreferences = data.notificationPreferences;
    if (data.privacySettings !== undefined) prof.privacySettings = data.privacySettings;
  } else {
    // Create profile if missing
    mockProfiles.push({
      id: `prof_${Date.now()}`,
      userId: authUser.userId,
      businessName: data.businessName,
      businessTaxId: data.businessTaxId,
      address: data.address,
      billingDetails: data.billingDetails,
      logoUrl: data.logoUrl,
      notificationPreferences: data.notificationPreferences,
      privacySettings: data.privacySettings,
    });
  }

  const updatedUser = mockUsers[userIdx];
  const updatedProfile = mockProfiles.find((p) => p.userId === authUser.userId);

  mockAuditLogs.push({
    id: `audit_${Date.now()}`,
    userId: authUser.userId,
    action: "USER_PROFILE_UPDATED",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: req.headers.get("user-agent") || "Unknown",
    payload: data,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      role: updatedUser.role,
      profile: updatedProfile || null,
    },
  });
});

// DELETE /api/v1/profile
export const DELETE = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const userIdx = mockUsers.findIndex((u) => u.id === authUser.userId);
  const profileIdx = mockProfiles.findIndex((p) => p.userId === authUser.userId);

  if (userIdx !== -1) {
    mockUsers.splice(userIdx, 1);
  }
  if (profileIdx !== -1) {
    mockProfiles.splice(profileIdx, 1);
  }

  mockAuditLogs.push({
    id: `audit_${Date.now()}`,
    userId: authUser.userId,
    action: "USER_ACCOUNT_TERMINATED",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: req.headers.get("user-agent") || "Unknown",
    createdAt: new Date().toISOString()
  });

  const response = NextResponse.json({
    success: true,
    data: { message: "Account and associated details deleted successfully." },
  });

  clearRefreshTokenCookie(response);

  return response;
});
