import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { ReferralService } from "@/modules/referrals/services/referral.service";
import { z } from "zod";

const processPayoutSchema = z.object({
  referralId: z.string().uuid("Invalid referralId format"),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["ADMIN", "SUPER_ADMIN"]);

  const body = await req.json();
  const { referralId } = processPayoutSchema.parse(body);

  const result = await ReferralService.processPayout(referralId);

  return NextResponse.json({
    success: true,
    data: result
  });
});
