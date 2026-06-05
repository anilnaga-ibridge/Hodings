import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { ReferralService } from "@/modules/referrals/services/referral.service";
import { AppError } from "@/core/errors/AppError";

type RouteContext = {
  params: Promise<{ partnerId: string }>;
};

export const GET = withErrorHandler(async (req: NextRequest, context: RouteContext) => {
  const authUser = getAuthenticatedUser(req);
  const params = await context.params;
  const { partnerId } = params;

  if (partnerId !== authUser.userId && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("You do not have permission to view other partners' commissions.", 403, "FORBIDDEN");
  }

  const result = await ReferralService.getPartnerCommissions(partnerId);

  return NextResponse.json({
    success: true,
    data: result
  });
});
