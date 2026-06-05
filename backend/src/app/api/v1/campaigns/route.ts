import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { BookingService } from "@/modules/bookings/services/booking.service";
import { createCampaignSchema } from "@/modules/bookings/dto/booking.dto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const result = await BookingService.getCampaigns(authUser.userId, authUser.role);

  return NextResponse.json({
    success: true,
    data: result
  });
});

export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const body = await req.json();
  const input = createCampaignSchema.parse(body);

  const result = await BookingService.createCampaign(authUser.userId, input);

  return NextResponse.json({
    success: true,
    data: result
  }, { status: 201 });
});
