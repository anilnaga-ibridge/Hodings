import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { BookingService } from "@/modules/bookings/services/booking.service";
import { updateQuotationSchema } from "@/modules/bookings/dto/booking.dto";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const PUT = withErrorHandler(async (req: NextRequest, context: RouteContext) => {
  const authUser = getAuthenticatedUser(req);
  const params = await context.params;
  const { id } = params;

  const body = await req.json();
  const input = updateQuotationSchema.parse(body);

  const result = await BookingService.updateQuotation(id, authUser.userId, authUser.role, input);

  return NextResponse.json({
    success: true,
    data: result
  });
});
