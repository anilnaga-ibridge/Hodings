import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { initializeMockDb, mockBrandAssets } from "@/utils/mockDb";
import { z } from "zod";

const createBrandAssetSchema = z.object({
  name: z.string().min(1, "Asset library name is required"),
  logoUrl: z.string().url("Invalid logo URL format").optional().nullable(),
  assetUrl: z.string().url("Invalid guidelines document URL format"),
  colorPalette: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, "Primary color must be hex format (e.g. #FFFFFF)"),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, "Secondary color must be hex format"),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i, "Accent color must be hex format"),
  }).optional().nullable(),
  typography: z.object({
    headings: z.string().min(1, "Headings font family is required"),
    body: z.string().min(1, "Body font family is required"),
  }).optional().nullable(),
});

// GET /api/v1/brand
export const GET = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const userAssets = mockBrandAssets.filter((asset) => asset.customerId === authUser.userId);

  return NextResponse.json({
    success: true,
    data: userAssets,
  });
});

// POST /api/v1/brand
export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const body = await req.json();
  const data = createBrandAssetSchema.parse(body);

  const newAsset = {
    id: `brand_${Date.now()}`,
    customerId: authUser.userId,
    name: data.name,
    logoUrl: data.logoUrl || null,
    assetUrl: data.assetUrl,
    colorPalette: data.colorPalette || null,
    typography: data.typography || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockBrandAssets.push(newAsset);

  return NextResponse.json(
    {
      success: true,
      data: newAsset,
    },
    { status: 201 }
  );
});
