import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { prisma } from "@/core/config/db";
import { z } from "zod";

const createBrandColorSchema = z.object({
  type: z.enum(["PRIMARY", "SECONDARY", "ACCENT", "NEUTRAL", "SUCCESS", "WARNING", "ERROR"]),
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9A-F]{6}$/i),
  rgb: z.string(),
  hsl: z.string(),
});

const createBrandFontSchema = z.object({
  type: z.enum(["HEADING", "SUBHEADING", "BODY", "CAPTION"]),
  fontFamily: z.string().min(1),
  weight: z.string().default("400"),
  sizeScale: z.number().int().positive(),
  lineHeight: z.number().positive(),
  letterSpacing: z.number(),
});

const createBrandGradientSchema = z.object({
  name: z.string().min(1),
  stops: z.array(z.object({
    color: z.string(),
    offset: z.number(),
  })),
  direction: z.string().min(1),
});

const createBrandVoiceSchema = z.object({
  tone: z.string().min(1),
  writingStyle: z.string().min(1),
  keywords: z.array(z.string()),
  values: z.array(z.string()),
});

const createBrandKitSchema = z.object({
  name: z.string().min(1, "Brand name is required"),
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
  colors: z.array(createBrandColorSchema).optional(),
  fonts: z.array(createBrandFontSchema).optional(),
  gradients: z.array(createBrandGradientSchema).optional(),
  voice: createBrandVoiceSchema.optional(),
});

// GET /api/v1/brand-kit
export const GET = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);

  const brandKits = await prisma.brandKit.findMany({
    where: { userId: authUser.userId },
    include: {
      colors: true,
      fonts: true,
      gradients: true,
      voice: true,
      assets: true,
      templates: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Seed standard default brand kit if user has none
  if (brandKits.length === 0) {
    const defaultKit = await prisma.brandKit.create({
      data: {
        userId: authUser.userId,
        name: "Default Brand Kit",
        tagline: "Simplify Design Operations",
        description: "Standard starter assets, typography guidelines, and color systems.",
        colors: {
          create: [
            { name: "Primary Indigo", type: "PRIMARY", hex: "#6366F1", rgb: "rgb(99, 102, 241)", hsl: "hsl(239, 84%, 67%)" },
            { name: "Secondary Slate", type: "SECONDARY", hex: "#475569", rgb: "rgb(71, 85, 105)", hsl: "hsl(215, 19%, 35%)" },
            { name: "Accent Pink", type: "ACCENT", hex: "#EC4899", rgb: "rgb(236, 72, 153)", hsl: "hsl(330, 81%, 60%)" },
            { name: "Neutral Slate", type: "NEUTRAL", hex: "#F8FAF8", rgb: "rgb(248, 250, 248)", hsl: "hsl(120, 10%, 98%)" },
            { name: "Emerald Success", type: "SUCCESS", hex: "#10B981", rgb: "rgb(16, 185, 129)", hsl: "hsl(160, 84%, 39%)" },
            { name: "Amber Warning", type: "WARNING", hex: "#F59E0B", rgb: "rgb(245, 158, 11)", hsl: "hsl(38, 92%, 50%)" },
            { name: "Rose Error", type: "ERROR", hex: "#EF4444", rgb: "rgb(239, 68, 68)", hsl: "hsl(0, 84%, 60%)" }
          ]
        },
        fonts: {
          create: [
            { type: "HEADING", fontFamily: "Outfit", weight: "700", sizeScale: 48, lineHeight: 1.2, letterSpacing: -0.02 },
            { type: "SUBHEADING", fontFamily: "Outfit", weight: "600", sizeScale: 28, lineHeight: 1.3, letterSpacing: -0.01 },
            { type: "BODY", fontFamily: "Inter", weight: "400", sizeScale: 16, lineHeight: 1.5, letterSpacing: 0.0 },
            { type: "CAPTION", fontFamily: "Inter", weight: "400", sizeScale: 12, lineHeight: 1.4, letterSpacing: 0.01 }
          ]
        },
        gradients: {
          create: [
            { name: "Ocean Blue", direction: "to right", stops: [{ color: "#2563EB", offset: 0 }, { color: "#06B6D4", offset: 100 }] },
            { name: "Sunset Orange", direction: "to right", stops: [{ color: "#F59E0B", offset: 0 }, { color: "#EF4444", offset: 100 }] },
            { name: "Purple Glow", direction: "to right", stops: [{ color: "#8B5CF6", offset: 0 }, { color: "#EC4899", offset: 100 }] }
          ]
        },
        voice: {
          create: {
            tone: "Modern",
            writingStyle: "Clean, professional, and bold.",
            keywords: ["innovative", "premium", "dynamic"],
            values: ["design quality", "accessibility", "visual impact"]
          }
        }
      },
      include: {
        colors: true,
        fonts: true,
        gradients: true,
        voice: true,
        assets: true,
        templates: true,
      }
    });
    return NextResponse.json({ success: true, data: [defaultKit] });
  }

  return NextResponse.json({
    success: true,
    data: brandKits,
  });
});

// POST /api/v1/brand-kit
export const POST = withErrorHandler(async (req: NextRequest) => {
  const authUser = getAuthenticatedUser(req);

  const body = await req.json();
  const data = createBrandKitSchema.parse(body);

  const newBrandKit = await prisma.brandKit.create({
    data: {
      userId: authUser.userId,
      name: data.name,
      description: data.description || null,
      website: data.website || null,
      tagline: data.tagline || null,
      industry: data.industry || null,
      logoPrimary: data.logoPrimary || null,
      logoSecondary: data.logoSecondary || null,
      logoIcon: data.logoIcon || null,
      logoWhite: data.logoWhite || null,
      logoDark: data.logoDark || null,
      logoHorizontal: data.logoHorizontal || null,
      logoVertical: data.logoVertical || null,
      favicon: data.favicon || null,
      colors: data.colors ? {
        create: data.colors.map(c => ({
          type: c.type,
          name: c.name,
          hex: c.hex,
          rgb: c.rgb,
          hsl: c.hsl,
        }))
      } : undefined,
      fonts: data.fonts ? {
        create: data.fonts.map(f => ({
          type: f.type,
          fontFamily: f.fontFamily,
          weight: f.weight,
          sizeScale: f.sizeScale,
          lineHeight: f.lineHeight,
          letterSpacing: f.letterSpacing,
        }))
      } : undefined,
      gradients: data.gradients ? {
        create: data.gradients.map(g => ({
          name: g.name,
          direction: g.direction,
          stops: g.stops,
        }))
      } : undefined,
      voice: data.voice ? {
        create: {
          tone: data.voice.tone,
          writingStyle: data.voice.writingStyle,
          keywords: data.voice.keywords,
          values: data.voice.values,
        }
      } : undefined,
    },
    include: {
      colors: true,
      fonts: true,
      gradients: true,
      voice: true,
      assets: true,
      templates: true,
    }
  });

  return NextResponse.json({
    success: true,
    data: newBrandKit,
  }, { status: 201 });
});
