import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { BillboardService } from "@/modules/billboards/services/billboard.service";
import { calculatePricingSchema } from "@/modules/billboards/dto/billboard.dto";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(
  async (req: NextRequest, context: RouteContext) => {
    const params = await context.params;
    const { id } = params;

    const body = await req.json();
    const { startDate, endDate } = calculatePricingSchema.parse(body);

    const calculation = await BillboardService.calculatePricing(id, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: calculation,
    });
  }
);
