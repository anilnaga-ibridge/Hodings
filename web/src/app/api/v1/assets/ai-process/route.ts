import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { prisma } from "@/core/config/db";
import { AppError } from "@/core/errors/AppError";
import { z } from "zod";

const aiProcessSchema = z.object({
  assetId: z.string().min(1, "Asset ID is required"),
  action: z.enum(["remove-background", "enhance", "upscale", "auto-tag"]),
});

// POST /api/v1/assets/ai-process
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);
  const body = await req.json();
  const { assetId, action } = aiProcessSchema.parse(body);

  // Verify asset ownership
  const asset = await prisma.asset.findFirst({
    where: {
      id: assetId,
      customerId: authUser.userId,
    },
    include: {
      tags: true,
    },
  });

  if (!asset) {
    throw new AppError("Asset not found or access denied.", 404, "NOT_FOUND");
  }

  // Artificial processing delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  let updatedAsset = asset;
  const currentTagNames = asset.tags.map((t) => t.name);

  if (action === "remove-background") {
    // Simulated BG Removal: In a real system, we would call an AI removebg API.
    // For demo/mock fidelity, we will append a "bg-removed" suffix and add a transparent tag.
    const newTags = Array.from(new Set([...currentTagNames, "bg-removed", "transparent"]));
    
    updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        name: `${asset.name.split(".")[0]} (No Background)`,
        tags: {
          set: [],
          connectOrCreate: newTags.map((t) => ({
            where: { name: t },
            create: { name: t },
          })),
        },
      },
      include: { tags: true, folder: true },
    });
  } 
  
  else if (action === "enhance") {
    // Simulated Enhancement: increase crispness description, append "enhanced" tag
    const newTags = Array.from(new Set([...currentTagNames, "ai-enhanced", "vibrant"]));
    
    updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        tags: {
          set: [],
          connectOrCreate: newTags.map((t) => ({
            where: { name: t },
            create: { name: t },
          })),
        },
      },
      include: { tags: true, folder: true },
    });
  } 
  
  else if (action === "upscale") {
    // Simulated upscale: double resolution bounds, add "high-res" tag
    const newWidth = asset.width ? asset.width * 2 : 1920;
    const newHeight = asset.height ? asset.height * 2 : 1080;
    const newTags = Array.from(new Set([...currentTagNames, "4k-upscaled", "high-res"]));

    updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        width: newWidth,
        height: newHeight,
        size: Math.round(asset.size * 1.5), // simulated size increase
        tags: {
          set: [],
          connectOrCreate: newTags.map((t) => ({
            where: { name: t },
            create: { name: t },
          })),
        },
      },
      include: { tags: true, folder: true },
    });
  } 
  
  else if (action === "auto-tag") {
    // AI Auto tagging analyzer based on filename
    const inferredTags: string[] = ["uploaded"];
    const nameLower = asset.name.toLowerCase();

    if (nameLower.includes("logo") || nameLower.includes("brand")) inferredTags.push("logo");
    if (nameLower.includes("banner") || nameLower.includes("hero")) inferredTags.push("banner");
    if (nameLower.includes("social") || nameLower.includes("insta") || nameLower.includes("post")) inferredTags.push("social");
    if (nameLower.includes("product") || nameLower.includes("item") || nameLower.includes("shop")) inferredTags.push("product");
    if (nameLower.includes("bg") || nameLower.includes("background") || nameLower.includes("wallpaper")) inferredTags.push("background");
    if (nameLower.includes("mockup") || nameLower.includes("preview")) inferredTags.push("mockup");
    if (asset.type === "VIDEO") inferredTags.push("video");
    if (asset.type === "AUDIO") inferredTags.push("audio");

    const newTags = Array.from(new Set([...currentTagNames, ...inferredTags]));

    updatedAsset = await prisma.asset.update({
      where: { id: assetId },
      data: {
        tags: {
          set: [],
          connectOrCreate: newTags.map((t) => ({
            where: { name: t },
            create: { name: t },
          })),
        },
      },
      include: { tags: true, folder: true },
    });
  }

  return NextResponse.json({
    success: true,
    action,
    data: updatedAsset,
  });
});
