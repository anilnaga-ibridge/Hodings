import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { BillboardService } from "@/modules/billboards/services/billboard.service";
import { AppError } from "@/core/errors/AppError";
import { z } from "zod";

const updateBillboardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  dimensions: z.string().min(1).optional(),
  locationType: z.enum(["INDOOR", "OUTDOOR", "DIGITAL", "STATIC", "TRANSIT"]).optional(),
  pricePerDay: z.number().min(0).optional(),
  minimumBookingDays: z.number().int().min(1).optional(),
  isAvailable: z.boolean().optional(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SUSPENDED"]).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/owner/billboards/[id]
export const GET = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["OWNER", "ADMIN", "SUPER_ADMIN"]);

  const { id } = await params;
  const billboard = await BillboardService.getDetails(id);

  // Security check: must own or be admin
  if (billboard.ownerId !== authUser.userId && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("You do not have permission to view this listing.", 403, "FORBIDDEN");
  }

  return NextResponse.json({
    success: true,
    data: billboard,
  });
});

// PUT /api/v1/owner/billboards/[id]
export const PUT = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["OWNER", "ADMIN", "SUPER_ADMIN"]);

  const { id } = await params;
  const body = await req.json();
  const data = updateBillboardSchema.parse(body);

  const updatedBillboard = await BillboardService.update(id, authUser.userId, authUser.role, data);

  return NextResponse.json({
    success: true,
    data: updatedBillboard,
  });
});

// DELETE /api/v1/owner/billboards/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const authUser = getAuthenticatedUser(req);
  authorizeRoles(authUser, ["OWNER", "ADMIN", "SUPER_ADMIN"]);

  const { id } = await params;
  
  await BillboardService.delete(id, authUser.userId, authUser.role);

  return NextResponse.json({
    success: true,
    data: { message: "Billboard listing successfully removed." },
  });
});
