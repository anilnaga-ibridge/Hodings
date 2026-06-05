import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { ReferralService } from "@/modules/referrals/services/referral.service";
import { z } from "zod";

const registerReferralSchema = z.object({
  refereeId: z.string().uuid("Invalid refereeId format"),
  referralCode: z.string().min(1, "Referral code is required"),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const body = await req.json();
  const { refereeId, referralCode } = registerReferralSchema.parse(body);

  const result = await ReferralService.registerReferral(authUser.userId, refereeId, referralCode);

  return NextResponse.json({
    success: true,
    data: result
  });
});
