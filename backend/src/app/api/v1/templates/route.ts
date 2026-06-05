import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser } from "@/core/middleware/auth.middleware";
import { 
  initializeMockDb, 
  mockDesigns, 
  mockTemplateCategories 
} from "@/utils/mockDb";

// GET /api/v1/templates?category=billboard
export const GET = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();
  getAuthenticatedUser(req); // Enforce authentication
  
  const { searchParams } = new URL(req.url);
  const categorySlug = searchParams.get("category");

  let templates = mockDesigns.filter((d) => d.isTemplate);

  if (categorySlug) {
    const category = mockTemplateCategories.find((c) => c.slug === categorySlug);
    if (category) {
      templates = templates.filter((t) => t.categoryId === category.id);
    } else {
      templates = []; // Category doesn't exist
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      categories: mockTemplateCategories,
      templates,
    }
  });
});
