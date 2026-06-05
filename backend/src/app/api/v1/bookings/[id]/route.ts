import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { BookingService } from "@/modules/bookings/services/booking.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(async (req: NextRequest, context: RouteContext) => {
  const authUser = getAuthenticatedUser(req);
  const params = await context.params;
  const { id } = params;

  const result = await BookingService.getDetails(id, authUser.userId, authUser.role);

  return NextResponse.json({
    success: true,
    data: result
  });
});
