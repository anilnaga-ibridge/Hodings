import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { initializeMockDb, mockBillboards } from "@/utils/mockDb";

export const GET = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query")?.toLowerCase() || "";
  const type = searchParams.get("type");
  const minPrice = parseFloat(searchParams.get("minPrice") || "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "Infinity");
  const city = searchParams.get("city")?.toLowerCase() || "";

  let filtered = [...mockBillboards];

  if (query) {
    filtered = filtered.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.description.toLowerCase().includes(query) ||
        b.address.toLowerCase().includes(query)
    );
  }

  if (city) {
    filtered = filtered.filter((b) => b.city.toLowerCase() === city);
  }

  if (type) {
    filtered = filtered.filter((b) => b.locationType === type || b.locationType.toLowerCase() === type.toLowerCase());
  }

  filtered = filtered.filter(
    (b) => b.pricePerDay >= minPrice && b.pricePerDay <= maxPrice
  );

  return NextResponse.json({
    success: true,
    data: filtered,
  });
});
