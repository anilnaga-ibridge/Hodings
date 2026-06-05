import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { ReferralService } from "@/modules/referrals/services/referral.service";
import { z } from "zod";

const calculateCommissionSchema = z.object({
  bookingId: z.string().uuid("Invalid bookingId format"),
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["ADMIN", "SUPER_ADMIN", "OWNER"]);

  const body = await req.json();
  const { bookingId } = calculateCommissionSchema.parse(body);

  const result = await ReferralService.calculateCommission(bookingId);

  return NextResponse.json({
    success: true,
    data: result
  });
});
