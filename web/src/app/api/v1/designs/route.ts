import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { 
  initializeMockDb, 
  mockDesigns, 
  mockTeamMembers 
} from "@/utils/mockDb";
import { z } from "zod";

const createDesignSchema = z.object({
  name: z.string().min(1, "Design name is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  width: z.number().int().positive("Width must be a positive integer"),
  height: z.number().int().positive("Height must be a positive integer"),
  canvasJson: z.string().optional(),
  isTemplate: z.boolean().optional().default(false),
  categoryId: z.string().nullable().optional(),
});

// GET /api/v1/designs?workspaceId=wsp_001&isTemplate=false
export const GET = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");
  const isTemplateStr = searchParams.get("isTemplate");

  if (!workspaceId) {
    throw new AppError("workspaceId query parameter is required", 400, "BAD_REQUEST");
  }

  // Verify membership
  const isMember = mockTeamMembers.some(
    (m) => m.workspaceId === workspaceId && m.userId === authUser.userId
  );
  if (!isMember) {
    throw new AppError("You do not have access to this workspace.", 403, "FORBIDDEN");
  }

  let designs = mockDesigns.filter((d) => d.workspaceId === workspaceId);

  if (isTemplateStr !== null) {
    const isTemplate = isTemplateStr === "true";
    designs = designs.filter((d) => d.isTemplate === isTemplate);
  }

  return NextResponse.json({
    success: true,
    data: designs,
  });
});

// POST /api/v1/designs
export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const body = await req.json();
  const data = createDesignSchema.parse(body);

  // Verify membership
  const memberShip = mockTeamMembers.find(
    (m) => m.workspaceId === data.workspaceId && m.userId === authUser.userId
  );
  if (!memberShip) {
    throw new AppError("You do not have access to this workspace.", 403, "FORBIDDEN");
  }

  const defaultCanvas = JSON.stringify({
    version: "5.3.0",
    objects: [
      {
        type: "rect",
        left: 0,
        top: 0,
        width: data.width,
        height: data.height,
        fill: "#ffffff",
        selectable: false,
      }
    ]
  });

  const newDesign = {
    id: `design_${Date.now()}`,
    name: data.name,
    workspaceId: data.workspaceId,
    createdById: authUser.userId,
    width: data.width,
    height: data.height,
    canvasJson: data.canvasJson || defaultCanvas,
    status: "DRAFT" as const,
    isTemplate: data.isTemplate,
    categoryId: data.categoryId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockDesigns.push(newDesign);

  return NextResponse.json(
    {
      success: true,
      data: newDesign,
    },
    { status: 201 }
  );
});
