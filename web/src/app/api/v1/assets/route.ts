import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { prisma } from "@/core/config/db";
import { z } from "zod";

const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required"),
  type: z.string().min(1, "Asset type is required"),
  url: z.string().min(1, "Asset URL is required"),
  thumbnailUrl: z.string().optional().nullable(),
  width: z.number().int().optional().nullable(),
  height: z.number().int().optional().nullable(),
  size: z.number().int().nonnegative().default(0),
  folderId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional().default(false),
});

// GET /api/v1/assets
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const { searchParams } = new URL(req.url);

  const search = searchParams.get("search");
  const type = searchParams.get("type");
  const folderId = searchParams.get("folderId");
  const favorite = searchParams.get("favorite");
  const tag = searchParams.get("tag");
  const sort = searchParams.get("sort"); // "date_desc" | "date_asc" | "size_desc" | "size_asc" | "name_asc" | "name_desc"

  // Build prisma filter conditions
  const where: any = {
    customerId: authUser.userId,
  };

  // Folder filter:
  // If folderId is "null", query items at the root (folderId = null).
  // Otherwise, query items inside the specified folderId.
  if (folderId === "null" || folderId === "") {
    where.folderId = null;
  } else if (folderId) {
    where.folderId = folderId;
  }

  // Type filter
  if (type && type !== "all") {
    where.type = type.toUpperCase();
  }

  // Favorite filter
  if (favorite === "true") {
    where.favorite = true;
  }

  // Search filter (name or tags matching keyword)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { tags: { some: { name: { contains: search, mode: "insensitive" } } } }
    ];
  }

  // Tag filter
  if (tag) {
    where.tags = {
      some: {
        name: { equals: tag, mode: "insensitive" }
      }
    };
  }

  // Sort parameters
  let orderBy: any = { uploadedAt: "desc" }; // Default sorting
  if (sort === "date_asc") {
    orderBy = { uploadedAt: "asc" };
  } else if (sort === "size_desc") {
    orderBy = { size: "desc" };
  } else if (sort === "size_asc") {
    orderBy = { size: "asc" };
  } else if (sort === "name_asc") {
    orderBy = { name: "asc" };
  } else if (sort === "name_desc") {
    orderBy = { name: "desc" };
  }

  const assets = await prisma.asset.findMany({
    where,
    orderBy,
    include: {
      tags: true,
      folder: true,
    },
  });

  return NextResponse.json({
    success: true,
    data: assets,
  });
});

// POST /api/v1/assets
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const body = await req.json();
  const data = createAssetSchema.parse(body);

  // Duplicate detection: check if same user already has same file name + size
  const duplicate = await prisma.asset.findFirst({
    where: {
      customerId: authUser.userId,
      name: data.name,
      size: data.size,
    },
  });

  if (duplicate) {
    return NextResponse.json({
      success: true,
      duplicateDetected: true,
      message: "Asset with matching file name and size already exists.",
      data: duplicate,
    });
  }

  // Create tags if they don't exist
  const tagsConnect = data.tags && data.tags.length > 0
    ? data.tags.map((t) => ({
        where: { name: t },
        create: { name: t },
      }))
    : [];

  const asset = await prisma.asset.create({
    data: {
      name: data.name,
      type: data.type.toUpperCase(),
      url: data.url,
      thumbnailUrl: data.thumbnailUrl || data.url,
      width: data.width,
      height: data.height,
      size: data.size,
      favorite: data.favorite,
      folderId: data.folderId || null,
      customerId: authUser.userId,
      tags: {
        connectOrCreate: tagsConnect,
      },
    },
    include: {
      tags: true,
      folder: true,
    },
  });

  return NextResponse.json({
    success: true,
    data,
    asset,
  });
});
