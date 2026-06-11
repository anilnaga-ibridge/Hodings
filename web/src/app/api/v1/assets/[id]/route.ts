import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { prisma } from "@/core/config/db";
import { AppError } from "@/core/errors/AppError";
import { z } from "zod";

const updateAssetSchema = z.object({
  name: z.string().min(1).optional(),
  folderId: z.string().nullable().optional(),
  favorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/v1/assets/[id]
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const authUser = getAuthenticatedUser(req);

  const asset = await prisma.asset.findFirst({
    where: {
      id,
      customerId: authUser.userId,
    },
    include: {
      tags: true,
      folder: true,
    },
  });

  if (!asset) {
    throw new AppError("Asset not found.", 404, "NOT_FOUND");
  }

  return NextResponse.json({
    success: true,
    data: asset,
  });
});

// PUT /api/v1/assets/[id]
export const PUT = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const authUser = getAuthenticatedUser(req);
  
  // Verify asset ownership
  const existingAsset = await prisma.asset.findFirst({
    where: {
      id,
      customerId: authUser.userId,
    },
  });

  if (!existingAsset) {
    throw new AppError("Asset not found or access denied.", 404, "NOT_FOUND");
  }

  const body = await req.json();
  const data = updateAssetSchema.parse(body);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.favorite !== undefined) updateData.favorite = data.favorite;
  
  // Explicitly handle moving to folder (which could be set to null/root)
  if (data.folderId !== undefined) {
    updateData.folderId = data.folderId;
  }

  if (data.tags !== undefined) {
    updateData.tags = {
      set: [], // disconnect existing tags
      connectOrCreate: data.tags.map((t) => ({
        where: { name: t },
        create: { name: t },
      })),
    };
  }

  const updatedAsset = await prisma.asset.update({
    where: { id },
    data: updateData,
    include: {
      tags: true,
      folder: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: updatedAsset,
  });
});

// DELETE /api/v1/assets/[id]
export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const authUser = getAuthenticatedUser(req);

  const existingAsset = await prisma.asset.findFirst({
    where: {
      id,
      customerId: authUser.userId,
    },
  });

  if (!existingAsset) {
    throw new AppError("Asset not found or access denied.", 404, "NOT_FOUND");
  }

  await prisma.asset.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: "Asset successfully deleted.",
  });
});

// POST /api/v1/assets/[id] (Duplicating the asset)
export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const authUser = getAuthenticatedUser(req);

  const existingAsset = await prisma.asset.findFirst({
    where: {
      id,
      customerId: authUser.userId,
    },
    include: {
      tags: true,
    },
  });

  if (!existingAsset) {
    throw new AppError("Source asset not found.", 404, "NOT_FOUND");
  }

  // Generate unique duplicate name: e.g. "Logo Copy" or "Logo Copy 2"
  const baseName = existingAsset.name.replace(/\s+Copy(\s+\d+)?$/, "");
  
  // Query similar files to compute copy sequence suffix
  const similarAssets = await prisma.asset.findMany({
    where: {
      customerId: authUser.userId,
      name: { startsWith: baseName },
    },
    select: { name: true },
  });

  let suffix = "";
  let copyCount = 1;
  const existingNames = similarAssets.map((a) => a.name);
  
  while (existingNames.includes(`${baseName} Copy${suffix}`)) {
    copyCount++;
    suffix = ` ${copyCount}`;
  }
  const duplicateName = `${baseName} Copy${suffix}`;

  const duplicatedAsset = await prisma.asset.create({
    data: {
      name: duplicateName,
      type: existingAsset.type,
      url: existingAsset.url,
      thumbnailUrl: existingAsset.thumbnailUrl,
      width: existingAsset.width,
      height: existingAsset.height,
      size: existingAsset.size,
      favorite: existingAsset.favorite,
      folderId: existingAsset.folderId,
      customerId: authUser.userId,
      tags: {
        connect: existingAsset.tags.map((t) => ({ id: t.id })),
      },
    },
    include: {
      tags: true,
      folder: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: duplicatedAsset,
  });
});
