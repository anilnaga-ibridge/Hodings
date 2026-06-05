import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { BillboardService } from "@/modules/billboards/services/billboard.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorHandler(
  async (req: NextRequest, context: RouteContext) => {
    const params = await context.params;
    const { id } = params;

    const calendar = await BillboardService.getCalendar(id);

    return NextResponse.json({
      success: true,
      data: calendar,
    });
  }
);
