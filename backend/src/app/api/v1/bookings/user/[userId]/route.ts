import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { BookingService } from "@/modules/bookings/services/booking.service";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export const GET = withErrorHandler(async (req: NextRequest, context: RouteContext) => {
  const authUser = getAuthenticatedUser(req);
  const params = await context.params;
  const { userId } = params;

  const result = await BookingService.getByUser(authUser.userId, authUser.role, userId);

  return NextResponse.json({
    success: true,
    data: result
  });
});
