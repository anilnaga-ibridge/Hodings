import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { BillboardService } from "@/modules/billboards/services/billboard.service";
import { z } from "zod";

const createBillboardSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  latitude: z.number({ message: "Latitude coordinate is required" }),
  longitude: z.number({ message: "Longitude coordinate is required" }),
  dimensions: z.string().min(1, "Dimensions are required"),
  locationType: z.enum(["INDOOR", "OUTDOOR", "DIGITAL", "STATIC", "TRANSIT"]),
  pricePerDay: z.number().min(0, "Price must be non-negative"),
});

// GET /api/v1/owner/billboards
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["OWNER", "ADMIN", "SUPER_ADMIN"]);

  const ownerBillboards = await BillboardService.findByOwnerId(authUser.userId);

  return NextResponse.json({
    success: true,
    data: ownerBillboards,
  });
});

// POST /api/v1/owner/billboards
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["OWNER", "ADMIN", "SUPER_ADMIN"]);

  const body = await req.json();
  const data = createBillboardSchema.parse(body);

  const newBillboard = await BillboardService.create(authUser.userId, data);

  return NextResponse.json(
    {
      success: true,
      data: newBillboard,
    },
    { status: 201 }
  );
});
