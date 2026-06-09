import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { BillboardService } from "@/modules/billboards/services/billboard.service";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["OWNER", "ADMIN", "SUPER_ADMIN"]);

  const stats = await BillboardService.getOwnerStats(authUser.userId);

  return NextResponse.json({
    success: true,
    data: stats,
  });
});
