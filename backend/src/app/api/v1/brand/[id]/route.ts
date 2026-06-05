import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { initializeMockDb, mockBrandAssets } from "@/utils/mockDb";
import { z } from "zod";

const updateBrandAssetSchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().nullable(),
  assetUrl: z.string().url().optional(),
  colorPalette: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, "Hex code mismatch"),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, "Hex code mismatch"),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i, "Hex code mismatch"),
  }).optional().nullable(),
  typography: z.object({
    headings: z.string().min(1),
    body: z.string().min(1),
  }).optional().nullable(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/brand/[id]
export const GET = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const { id } = await params;
  const asset = mockBrandAssets.find((a) => a.id === id);

  if (!asset) {
    throw new AppError("Brand asset not found.", 404, "BRAND_ASSET_NOT_FOUND");
  }

  // Ownership verification
  if (asset.customerId !== authUser.userId && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("You do not have permission to view this brand asset.", 403, "FORBIDDEN");
  }

  return NextResponse.json({
    success: true,
    data: asset,
  });
});

// PUT /api/v1/brand/[id]
export const PUT = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const { id } = await params;
  const assetIdx = mockBrandAssets.findIndex((a) => a.id === id);

  if (assetIdx === -1) {
    throw new AppError("Brand asset not found.", 404, "BRAND_ASSET_NOT_FOUND");
  }

  const asset = mockBrandAssets[assetIdx];

  // Ownership verification
  if (asset.customerId !== authUser.userId && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("You do not have permission to edit this brand asset.", 403, "FORBIDDEN");
  }

  const body = await req.json();
  const data = updateBrandAssetSchema.parse(body);

  // Update properties
  if (data.name !== undefined) asset.name = data.name;
  if (data.logoUrl !== undefined) asset.logoUrl = data.logoUrl;
  if (data.assetUrl !== undefined) asset.assetUrl = data.assetUrl;
  if (data.colorPalette !== undefined) asset.colorPalette = data.colorPalette;
  if (data.typography !== undefined) asset.typography = data.typography;
  asset.updatedAt = new Date().toISOString();

  return NextResponse.json({
    success: true,
    data: asset,
  });
});

// DELETE /api/v1/brand/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const { id } = await params;
  const assetIdx = mockBrandAssets.findIndex((a) => a.id === id);

  if (assetIdx === -1) {
    throw new AppError("Brand asset not found.", 404, "BRAND_ASSET_NOT_FOUND");
  }

  const asset = mockBrandAssets[assetIdx];

  // Ownership verification
  if (asset.customerId !== authUser.userId && authUser.role !== "ADMIN" && authUser.role !== "SUPER_ADMIN") {
    throw new AppError("You do not have permission to delete this brand asset.", 403, "FORBIDDEN");
  }

  // Remove from mock array
  mockBrandAssets.splice(assetIdx, 1);

  return NextResponse.json({
    success: true,
    data: { message: "Brand asset library deleted successfully." },
  });
});
