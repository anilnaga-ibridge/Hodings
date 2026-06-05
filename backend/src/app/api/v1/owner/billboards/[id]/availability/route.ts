import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { BillboardService } from "@/modules/billboards/services/billboard.service";
import { blockAvailabilitySchema } from "@/modules/billboards/dto/billboard.dto";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function handleBlockDates(req: NextRequest, id: string) {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["OWNER", "ADMIN", "SUPER_ADMIN"]);

  const body = await req.json();
  const { dates, isAvailable, blockedReason } = blockAvailabilitySchema.parse(body);

  const availability = await BillboardService.blockAvailability(
    id,
    authUser.userId,
    authUser.role,
    dates,
    isAvailable,
    blockedReason
  );

  return NextResponse.json({
    success: true,
    data: availability,
  });
}

export const POST = withErrorHandler(
  async (req: NextRequest, context: RouteContext) => {
    const params = await context.params;
    return handleBlockDates(req, params.id);
  }
);

export const PUT = withErrorHandler(
  async (req: NextRequest, context: RouteContext) => {
    const params = await context.params;
    return handleBlockDates(req, params.id);
  }
);
