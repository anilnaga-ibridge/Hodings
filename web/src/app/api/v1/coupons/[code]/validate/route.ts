import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { CouponService } from "@/modules/coupons/services/coupon.service";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export const GET = withErrorHandler(async (req: NextRequest, context: RouteContext) => {
  const params = await context.params;
  const { code } = params;

  const { searchParams } = new URL(req.url);
  const subtotal = parseFloat(searchParams.get("subtotal") || "0");

  const result = await CouponService.validateCoupon(code, subtotal);

  return NextResponse.json({
    success: true,
    data: result
  });
});
