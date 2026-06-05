import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { ReferralService } from "@/modules/referrals/services/referral.service";
import { AppError } from "@/core/errors/AppError";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export const GET = withErrorHandler(async (req: NextRequest, context: RouteContext) => {
  const authUser = getAuthenticatedUser(req);
  const params = await context.params;
  const { userId } = params;

  // Access check: User can only see their own referral records unless Admin
  if (userId !== authUser.userId && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("You do not have permission to view other users' referrals.", 403, "FORBIDDEN");
  }

  const result = await ReferralService.getByUser(userId);

  return NextResponse.json({
    success: true,
    data: result
  });
});
