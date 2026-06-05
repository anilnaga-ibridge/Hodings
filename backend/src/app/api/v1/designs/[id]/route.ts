import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { 
  initializeMockDb, 
  mockDesigns, 
  mockTeamMembers,
  mockDesignVersions,
  mockUsers
} from "@/utils/mockDb";
import { z } from "zod";

const updateDesignSchema = z.object({
  name: z.string().min(1).optional(),
  canvasJson: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED", "ARCHIVED"]).optional(),
  isTemplate: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/v1/designs/[id]
export const GET = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);
  const { id } = await params;

  const design = mockDesigns.find((d) => d.id === id);
  if (!design) {
    throw new AppError("Design project not found.", 404, "NOT_FOUND");
  }

  // Verify membership in design's workspace
  const isMember = mockTeamMembers.some(
    (m) => m.workspaceId === design.workspaceId && m.userId === authUser.userId
  );
  if (!isMember) {
    throw new AppError("You do not have access to this design workspace.", 403, "FORBIDDEN");
  }

  return NextResponse.json({
    success: true,
    data: design,
  });
});

// PUT /api/v1/designs/[id]
export const PUT = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);
  const { id } = await params;

  const designIdx = mockDesigns.findIndex((d) => d.id === id);
  if (designIdx === -1) {
    throw new AppError("Design project not found.", 404, "NOT_FOUND");
  }

  const design = mockDesigns[designIdx];

  // Verify membership & role (need OWNER or EDITOR)
  const memberShip = mockTeamMembers.find(
    (m) => m.workspaceId === design.workspaceId && m.userId === authUser.userId
  );
  if (!memberShip || memberShip.role === "VIEWER") {
    throw new AppError("You do not have permission to edit this design.", 403, "FORBIDDEN");
  }

  const body = await req.json();
  const data = updateDesignSchema.parse(body);

  // If canvasJson is being updated, store current snapshot in DesignVersion history before updating
  if (data.canvasJson !== undefined && data.canvasJson !== design.canvasJson) {
    const activeVersions = mockDesignVersions.filter((v) => v.designId === id);
    const nextVersionNum = activeVersions.length + 1;
    const author = mockUsers.find((u) => u.id === authUser.userId);
    const authorName = author ? `${author.firstName} ${author.lastName}` : "Team Designer";

    mockDesignVersions.push({
      id: `ver_${Date.now()}`,
      designId: id,
      canvasJson: design.canvasJson,
      version: nextVersionNum,
      createdByName: authorName,
      createdAt: new Date().toISOString(),
    });
  }

  // Perform updates
  if (data.name !== undefined) design.name = data.name;
  if (data.canvasJson !== undefined) design.canvasJson = data.canvasJson;
  if (data.status !== undefined) design.status = data.status;
  if (data.isTemplate !== undefined) design.isTemplate = data.isTemplate;
  design.updatedAt = new Date().toISOString();

  return NextResponse.json({
    success: true,
    data: design,
  });
});

// DELETE /api/v1/designs/[id]
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);
  const { id } = await params;

  const designIdx = mockDesigns.findIndex((d) => d.id === id);
  if (designIdx === -1) {
    throw new AppError("Design project not found.", 404, "NOT_FOUND");
  }

  const design = mockDesigns[designIdx];

  // Verify membership (Only Workspace OWNER or Design Creator can delete)
  const memberShip = mockTeamMembers.find(
    (m) => m.workspaceId === design.workspaceId && m.userId === authUser.userId
  );
  const isCreator = design.createdById === authUser.userId;
  const isOwner = memberShip?.role === "OWNER";

  if (!isCreator && !isOwner) {
    throw new AppError("Only the creator or workspace owner can delete this design.", 403, "FORBIDDEN");
  }

  // Remove from mock array
  mockDesigns.splice(designIdx, 1);

  // Clean up versions
  for (let i = mockDesignVersions.length - 1; i >= 0; i--) {
    if (mockDesignVersions[i].designId === id) {
      mockDesignVersions.splice(i, 1);
    }
  }

  return NextResponse.json({
    success: true,
    data: { message: "Design successfully deleted." },
  });
});
