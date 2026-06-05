import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { CouponService } from "@/modules/coupons/services/coupon.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["ADMIN", "SUPER_ADMIN"]);

  const result = await CouponService.getCouponAnalytics();

  return NextResponse.json({
    success: true,
    data: result
  });
});
