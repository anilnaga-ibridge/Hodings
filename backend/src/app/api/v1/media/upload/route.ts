import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { AppError } from "@/core/errors/AppError";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const purpose = formData.get("purpose") as string | null; // "logo" or "guideline"

  if (!file) {
    throw new AppError("No file uploaded.", 400, "MISSING_FILE");
  }

  const mimeType = file.type;
  const fileSize = file.size;

  if (purpose === "logo" || mimeType.startsWith("image/")) {
    // Image validations (logo): PNG, JPG, WEBP, SVG, GIF. Max 5MB
    const allowedImages = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];
    if (!allowedImages.includes(mimeType)) {
      throw new AppError("Invalid image type. Allowed: JPEG, PNG, WEBP, GIF, SVG.", 400, "INVALID_FILE_TYPE");
    }
    if (fileSize > 5 * 1024 * 1024) {
      throw new AppError("Logo image file size exceeds the 5MB limit.", 400, "FILE_TOO_LARGE");
    }
  } else if (purpose === "guideline" || mimeType === "application/pdf" || mimeType.includes("word")) {
    // Guideline validations: PDF, DOCX, DOC. Max 10MB
    const allowedDocs = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedDocs.includes(mimeType)) {
      throw new AppError("Invalid document type. Allowed: PDF, DOC, DOCX.", 400, "INVALID_FILE_TYPE");
    }
    if (fileSize > 10 * 1024 * 1024) {
      throw new AppError("Guideline document file size exceeds the 10MB limit.", 400, "FILE_TOO_LARGE");
    }
  } else {
    throw new AppError("Unknown upload purpose or unsupported format.", 400, "UNSUPPORTED_UPLOAD");
  }

  // Convert file to Base64 Data URI for instant local storage/mock response
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const url = `data:${mimeType};base64,${base64}`;

  return NextResponse.json({
    success: true,
    data: {
      url,
      name: file.name,
      type: mimeType,
      size: fileSize,
    },
  });
});
