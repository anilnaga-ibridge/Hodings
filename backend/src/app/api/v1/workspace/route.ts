import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { AppError } from "@/core/errors/AppError";
import { 
  initializeMockDb, 
  mockWorkspaces, 
  mockTeamMembers 
} from "@/utils/mockDb";
import { z } from "zod";

const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Workspace name is required"),
});

// GET /api/v1/workspace
export const GET = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  // Find workspaces where the user is a member
  const memberWorkspacesList = mockTeamMembers.filter((m) => m.userId === authUser.userId);
  const userWorkspaces = mockWorkspaces.filter((w) => 
    memberWorkspacesList.some((m) => m.workspaceId === w.id)
  );

  return NextResponse.json({
    success: true,
    data: userWorkspaces,
  });
});

// POST /api/v1/workspace
export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  const authUser = getAuthenticatedUser(req);

  const body = await req.json();
  const data = createWorkspaceSchema.parse(body);

  const newWorkspaceId = `wsp_${Date.now()}`;
  const newWorkspace = {
    id: newWorkspaceId,
    name: data.name,
    logoUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newMember = {
    id: `mem_${Date.now()}`,
    workspaceId: newWorkspaceId,
    userId: authUser.userId,
    role: "OWNER" as const,
    createdAt: new Date().toISOString(),
  };

  mockWorkspaces.push(newWorkspace);
  mockTeamMembers.push(newMember);

  return NextResponse.json(
    {
      success: true,
      data: newWorkspace,
    },
    { status: 201 }
  );
});
