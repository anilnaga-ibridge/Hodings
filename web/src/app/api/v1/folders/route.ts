import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { 
  initializeMockDb, 
  mockFolders, 
  mockTeamMembers 
} from "@/utils/mockDb";
import { z } from "zod";

const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  parentId: z.string().nullable().optional(),
});

// GET /api/v1/folders?workspaceId=wsp_001
export const GET = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);
  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

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

  const folders = mockFolders.filter((f) => f.workspaceId === workspaceId);

  return NextResponse.json({
    success: true,
    data: folders,
  });
});

// POST /api/v1/folders
export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const body = await req.json();
  const data = createFolderSchema.parse(body);

  // Verify membership
  const isMember = mockTeamMembers.some(
    (m) => m.workspaceId === data.workspaceId && m.userId === authUser.userId
  );
  if (!isMember) {
    throw new AppError("You do not have access to this workspace.", 403, "FORBIDDEN");
  }

  // Create folder
  const newFolder = {
    id: `fold_${Date.now()}`,
    name: data.name,
    workspaceId: data.workspaceId,
    parentId: data.parentId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockFolders.push(newFolder);

  return NextResponse.json(
    {
      success: true,
      data: newFolder,
    },
    { status: 201 }
  );
});
