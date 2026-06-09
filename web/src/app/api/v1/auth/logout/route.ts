import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { clearRefreshTokenCookie } from "@/utils/jwt";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const response = NextResponse.json({
    success: true,
    data: { message: "Successfully logged out." },
  });

  clearRefreshTokenCookie(response);

  return response;
});
