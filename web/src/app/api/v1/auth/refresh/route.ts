import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { verifyRefreshToken, signAccessToken } from "@/utils/jwt";
import { AppError } from "@/core/errors/AppError";
import { initializeMockDb, mockUsers } from "@/utils/mockDb";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();

  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (!refreshToken) {
    throw new AppError("Authentication refresh token is missing.", 401, "REFRESH_TOKEN_MISSING");
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    // Verify user exists in mock database
    const user = mockUsers.find((u) => u.id === decoded.userId);

    if (!user) {
      throw new AppError("The user associated with this token no longer exists.", 401, "USER_NOT_FOUND");
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(payload);

    return NextResponse.json({
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
  } catch (error) {
    throw new AppError("The refresh token has expired or is invalid.", 401, "REFRESH_TOKEN_INVALID");
  }
});
