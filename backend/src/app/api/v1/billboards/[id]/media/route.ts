import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { getAuthenticatedUser, authorizeRoles } from "@/core/middleware/auth.middleware";
import { MediaUploadService } from "@/modules/billboards/services/media-upload.service";
import { BillboardService } from "@/modules/billboards/services/billboard.service";
import { AppError } from "@/core/errors/AppError";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const POST = withErrorHandler(
  async (req: NextRequest, context: RouteContext) => {
    // 1. Authenticate and Authorize
    const authUser = getAuthenticatedUser(req);
    authorizeRoles(authUser, ["OWNER", "ADMIN", "SUPER_ADMIN"]);

    const params = await context.params;
    const { id } = params;

    // 2. Parse Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const fileType = formData.get("fileType") as "IMAGE" | "VIDEO" | "PANORAMA" | null;
    const displayOrderStr = formData.get("displayOrder") as string | null;

    if (!file) {
      throw new AppError("No file provided for upload.", 400, "MISSING_FILE");
    }

    if (!fileType || !["IMAGE", "VIDEO", "PANORAMA"].includes(fileType)) {
      throw new AppError("Invalid or missing fileType. Must be IMAGE, VIDEO, or PANORAMA.", 400, "INVALID_FILE_TYPE");
    }

    const displayOrder = displayOrderStr ? parseInt(displayOrderStr, 10) : 0;

    // 3. Upload to storage
    const { fileUrl, thumbnailUrl } = await MediaUploadService.uploadMedia(file, fileType);

    // 4. Save record to DB (with ownership check)
    const mediaRecord = await BillboardService.addMedia(id, authUser.userId, authUser.role, {
      fileUrl,
      thumbnailUrl,
      fileType,
      displayOrder,
    });

    return NextResponse.json({
      success: true,
      data: mediaRecord,
    });
  }
);
