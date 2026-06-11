import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { prisma } from "@/core/config/db";
import { z } from "zod";

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  parentFolderId: z.string().optional().nullable(),
});

// GET /api/v1/assets/folders
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const { searchParams } = new URL(req.url);
  const parentFolderId = searchParams.get("parentFolderId");

  const where: any = {
    customerId: authUser.userId,
  };

  // If parentFolderId is explicitly queried:
  if (parentFolderId === "null" || parentFolderId === "") {
    where.parentFolderId = null;
  } else if (parentFolderId) {
    where.parentFolderId = parentFolderId;
  }

  const folders = await prisma.assetFolder.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      subFolders: true,
      _count: {
        select: { assets: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: folders,
  });
});

// POST /api/v1/assets/folders
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const body = await req.json();
  const data = createFolderSchema.parse(body);

  const folder = await prisma.assetFolder.create({
    data: {
      name: data.name,
      parentFolderId: data.parentFolderId || null,
      customerId: authUser.userId,
    },
    include: {
      subFolders: true,
      _count: {
        select: { assets: true },
      },
    },
  });

  return NextResponse.json({
    success: true,
    data: folder,
  });
});
