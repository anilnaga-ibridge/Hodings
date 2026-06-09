import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { BookingService } from "@/modules/bookings/services/booking.service";
import { applyBookingSchema } from "@/modules/bookings/dto/booking.dto";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const body = await req.json();
  const input = applyBookingSchema.parse(body);

  const result = await BookingService.apply(authUser.userId, input);

  return NextResponse.json({
    success: true,
    data: result
  }, { status: 201 });
});
