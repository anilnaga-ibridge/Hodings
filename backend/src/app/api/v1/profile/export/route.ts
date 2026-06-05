import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { initializeMockDb, mockUsers, mockProfiles } from "@/utils/mockDb";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const userData = mockUsers.find((u) => u.id === authUser.userId);
  const profileData = mockProfiles.find((p) => p.userId === authUser.userId);

  if (!userData) {
    throw new AppError("User data not found for export.", 404, "USER_NOT_FOUND");
  }

  // Compile export schema
  const exportPayload = {
    exportDate: new Date().toISOString(),
    personalData: {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      role: userData.role,
      createdAt: userData.createdAt,
    },
    profile: profileData || null,
    brandAssets: [],
    campaigns: [],
    reviews: [],
    supportTickets: [],
  };

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="gdpr-export-${userData.id}.json"`,
    },
  });
});
