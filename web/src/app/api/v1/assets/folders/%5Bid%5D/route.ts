import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { prisma } from "@/core/config/db";
import { AppError } from "@/core/errors/AppError";
import { z } from "zod";

const updateFolderSchema = z.object({
  name: z.string().min(1).optional(),
  parentFolderId: z.string().nullable().optional(),
});

// PUT /api/v1/assets/folders/[id]
export const PUT = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const authUser = getAuthenticatedUser(req);

  const existingFolder = await prisma.assetFolder.findFirst({
    where: {
      id,
      customerId: authUser.userId,
    },
  });

  if (!existingFolder) {
    throw new AppError("Folder not found.", 404, "NOT_FOUND");
  }

  const body = await req.json();
  const data = updateFolderSchema.parse(body);

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.parentFolderId !== undefined) {
    // Avoid cyclic folder hierarchies (folder cannot be its own parent)
    if (data.parentFolderId === id) {
      throw new AppError("A folder cannot be its own parent.", 400, "BAD_REQUEST");
    }
    updateData.parentFolderId = data.parentFolderId;
  }

  const updatedFolder = await prisma.assetFolder.update({
    where: { id },
    data: updateData,
    include: {
      subFolders: true,
      _count: {
        select: { assets: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: updatedFolder,
  });
});

// DELETE /api/v1/assets/folders/[id]
export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const authUser = getAuthenticatedUser(req);

  const existingFolder = await prisma.assetFolder.findFirst({
    where: {
      id,
      customerId: authUser.userId,
    },
  });

  if (!existingFolder) {
    throw new AppError("Folder not found.", 404, "NOT_FOUND");
  }

  // Delete the folder. Due to Prisma schema onDelete rules:
  // - Subfolders will cascade delete
  // - Assets inside the folder will have their folderId set to null (revert to root)
  await prisma.assetFolder.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: "Folder successfully deleted. Assets moved to root directory.",
  });
});
