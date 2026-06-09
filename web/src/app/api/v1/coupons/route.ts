import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { CouponService } from "@/modules/coupons/services/coupon.service";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z.string().min(1),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().min(0),
  maxUsage: z.number().int().optional(),
  minOrderAmount: z.number().optional(),
  expiryDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid expiry date" }),
  stackable: z.boolean().optional(),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["ADMIN", "SUPER_ADMIN"]);

  const body = await req.json();
  const input = createCouponSchema.parse(body);

  const result = await CouponService.createCoupon(input);

  return NextResponse.json({
    success: true,
    data: result
  }, { status: 201 });
});
