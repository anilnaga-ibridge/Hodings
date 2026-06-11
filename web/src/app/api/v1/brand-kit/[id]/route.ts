import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { prisma } from "@/core/config/db";
import { AppError } from "@/core/errors/AppError";
import { z } from "zod";

const updateBrandColorSchema = z.object({
  type: z.enum(["PRIMARY", "SECONDARY", "ACCENT", "NEUTRAL", "SUCCESS", "WARNING", "ERROR"]),
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9A-F]{6}$/i),
  rgb: z.string(),
  hsl: z.string(),
});

const updateBrandFontSchema = z.object({
  type: z.enum(["HEADING", "SUBHEADING", "BODY", "CAPTION"]),
  fontFamily: z.string().min(1),
  weight: z.string().default("400"),
  sizeScale: z.number().int().positive(),
  lineHeight: z.number().positive(),
  letterSpacing: z.number(),
});

const updateBrandGradientSchema = z.object({
  name: z.string().min(1),
  stops: z.array(z.object({
    color: z.string(),
    offset: z.number(),
  })),
  direction: z.string().min(1),
});

const updateBrandVoiceSchema = z.object({
  tone: z.string().min(1),
  writingStyle: z.string().min(1),
  keywords: z.array(z.string()),
  values: z.array(z.string()),
});

const updateBrandAssetSchema = z.object({
  name: z.string(),
  assetUrl: z.string(),
  type: z.enum(["LOGO", "IMAGE", "VIDEO", "SHAPE", "ICON", "STICKER", "FONT"]),
  mimeType: z.string(),
  size: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const updateBrandTemplateSchema = z.object({
  name: z.string(),
  width: z.number().int(),
  height: z.number().int(),
  canvasJson: z.string(),
});

const updateBrandKitSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  logoPrimary: z.string().optional().nullable(),
  logoSecondary: z.string().optional().nullable(),
  logoIcon: z.string().optional().nullable(),
  logoWhite: z.string().optional().nullable(),
  logoDark: z.string().optional().nullable(),
  logoHorizontal: z.string().optional().nullable(),
  logoVertical: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  colors: z.array(updateBrandColorSchema).optional(),
  fonts: z.array(updateBrandFontSchema).optional(),
  gradients: z.array(updateBrandGradientSchema).optional(),
  voice: updateBrandVoiceSchema.optional(),
  assets: z.array(updateBrandAssetSchema).optional(),
  templates: z.array(updateBrandTemplateSchema).optional(),
});

// GET /api/v1/brand-kit/[id]
export const GET = withErrorHandler(async (req: NextRequest, context: any) => {
  const authUser = getAuthenticatedUser(req);
  const { id } = context.params;

  const brandKit = await prisma.brandKit.findFirst({
    where: { id, userId: authUser.userId },
    include: {
      colors: true,
      fonts: true,
      gradients: true,
      voice: true,
      assets: true,
      templates: true,
    },
  });

  if (!brandKit) {
    throw new AppError("Brand kit not found", 404);
  }

  return NextResponse.json({
    success: true,
    data: brandKit,
  });
});

// PUT /api/v1/brand-kit/[id]
export const PUT = withErrorHandler(async (req: NextRequest, context: any) => {
  const authUser = getAuthenticatedUser(req);
  const { id } = context.params;

  const brandKit = await prisma.brandKit.findFirst({
    where: { id, userId: authUser.userId },
  });

  if (!brandKit) {
    throw new AppError("Brand kit not found or unauthorized", 404);
  }

  const body = await req.json();
  const data = updateBrandKitSchema.parse(body);

  const updatedKit = await prisma.$transaction(async (tx) => {
    // 1. Update brand kit profile fields
    const kit = await tx.brandKit.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        website: data.website,
        tagline: data.tagline,
        industry: data.industry,
        logoPrimary: data.logoPrimary,
        logoSecondary: data.logoSecondary,
        logoIcon: data.logoIcon,
        logoWhite: data.logoWhite,
        logoDark: data.logoDark,
        logoHorizontal: data.logoHorizontal,
        logoVertical: data.logoVertical,
        favicon: data.favicon,
      },
    });

    // 2. Update colors (replace entirely to make updates clean)
    if (data.colors) {
      await tx.brandColor.deleteMany({ where: { brandKitId: id } });
      if (data.colors.length > 0) {
        await tx.brandColor.createMany({
          data: data.colors.map(c => ({
            brandKitId: id,
            type: c.type,
            name: c.name,
            hex: c.hex,
            rgb: c.rgb,
            hsl: c.hsl,
          })),
        });
      }
    }

    // 3. Update fonts
    if (data.fonts) {
      await tx.brandFont.deleteMany({ where: { brandKitId: id } });
      if (data.fonts.length > 0) {
        await tx.brandFont.createMany({
          data: data.fonts.map(f => ({
            brandKitId: id,
            type: f.type,
            fontFamily: f.fontFamily,
            weight: f.weight,
            sizeScale: f.sizeScale,
            lineHeight: f.lineHeight,
            letterSpacing: f.letterSpacing,
          })),
        });
      }
    }

    // 4. Update gradients
    if (data.gradients) {
      await tx.brandGradient.deleteMany({ where: { brandKitId: id } });
      if (data.gradients.length > 0) {
        await tx.brandGradient.createMany({
          data: data.gradients.map(g => ({
            brandKitId: id,
            name: g.name,
            direction: g.direction,
            stops: g.stops,
          })),
        });
      }
    }

    // 5. Update voice
    if (data.voice) {
      await tx.brandVoice.upsert({
        where: { brandKitId: id },
        create: {
          brandKitId: id,
          tone: data.voice.tone,
          writingStyle: data.voice.writingStyle,
          keywords: data.voice.keywords,
          values: data.voice.values,
        },
        update: {
          tone: data.voice.tone,
          writingStyle: data.voice.writingStyle,
          keywords: data.voice.keywords,
          values: data.voice.values,
        },
      });
    }

    // 6. Update assets
    if (data.assets) {
      await tx.brandAsset.deleteMany({ where: { brandKitId: id } });
      if (data.assets.length > 0) {
        await tx.brandAsset.createMany({
          data: data.assets.map(a => ({
            brandKitId: id,
            customerId: authUser.userId,
            name: a.name,
            assetUrl: a.assetUrl,
            type: a.type,
            mimeType: a.mimeType,
            size: a.size || 0,
            tags: a.tags || [],
          })),
        });
      }
    }

    // 7. Update templates
    if (data.templates) {
      await tx.brandTemplate.deleteMany({ where: { brandKitId: id } });
      if (data.templates.length > 0) {
        await tx.brandTemplate.createMany({
          data: data.templates.map(t => ({
            brandKitId: id,
            name: t.name,
            width: t.width,
            height: t.height,
            canvasJson: t.canvasJson,
          })),
        });
      }
    }

    return tx.brandKit.findUnique({
      where: { id },
      include: {
        colors: true,
        fonts: true,
        gradients: true,
        voice: true,
        assets: true,
        templates: true,
      },
    });
  });

  return NextResponse.json({
    success: true,
    data: updatedKit,
  });
});

// DELETE /api/v1/brand-kit/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, context: any) => {
  const authUser = getAuthenticatedUser(req);
  const { id } = context.params;

  const brandKit = await prisma.brandKit.findFirst({
    where: { id, userId: authUser.userId },
  });

  if (!brandKit) {
    throw new AppError("Brand kit not found or unauthorized", 404);
  }

  await prisma.brandKit.delete({
    where: { id },
  });

  return NextResponse.json({
    success: true,
    message: "Brand kit deleted successfully",
  });
});
