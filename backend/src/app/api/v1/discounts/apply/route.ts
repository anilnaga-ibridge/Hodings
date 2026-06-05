import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { CouponService } from "@/modules/coupons/services/coupon.service";
import { z } from "zod";

const applyDiscountSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().min(0),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const body = await req.json();
  const { code, subtotal } = applyDiscountSchema.parse(body);

  const result = await CouponService.applyDiscount(code, subtotal);

  return NextResponse.json({
    success: true,
    data: result
  });
});
