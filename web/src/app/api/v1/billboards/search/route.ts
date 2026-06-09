import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { BillboardService } from "@/modules/billboards/services/billboard.service";
import { searchBillboardsSchema } from "@/modules/billboards/dto/billboard.dto";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  
  // Convert URLSearchParams to a plain object
  const queryObj: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    queryObj[key] = value;
  });

  // Validate request parameters using Zod
  const validatedInput = searchBillboardsSchema.parse(queryObj);

  const result = await BillboardService.search(validatedInput);

  return NextResponse.json({
    success: true,
    data: result,
  });
});
