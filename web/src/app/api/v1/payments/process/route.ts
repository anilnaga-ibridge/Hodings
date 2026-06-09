import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { BookingService } from "@/modules/bookings/services/booking.service";
import { processPaymentSchema } from "@/modules/bookings/dto/booking.dto";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const body = await req.json();
  const input = processPaymentSchema.parse(body);

  const result = await BookingService.processPayment(input);

  return NextResponse.json({
    success: true,
    data: result
  });
});
