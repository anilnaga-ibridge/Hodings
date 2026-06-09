import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AppError } from "@/core/errors/AppError";

// Configure Cloudinary if credentials exist
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Configure AWS S3 if credentials exist
const useS3 = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_BUCKET_NAME
);

const s3Client = useS3
  ? new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    })
  : null;

export class MediaUploadService {
  private static MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || "5242880", 10); // Default 5MB
  private static MAX_VIDEO_SIZE = parseInt(process.env.MAX_VIDEO_SIZE || "20971520", 10); // Default 20MB

  static async uploadMedia(
    file: File,
    fileType: "IMAGE" | "VIDEO" | "PANORAMA"
  ): Promise<{ fileUrl: string; thumbnailUrl: string }> {
    const mimeType = file.type;
    const fileSize = file.size;

    // 1. Validation
    if (fileType === "IMAGE" || fileType === "PANORAMA") {
      const allowedImages = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedImages.includes(mimeType)) {
        throw new AppError("Invalid image type. Allowed: JPEG, PNG, WEBP.", 400, "INVALID_FILE_TYPE");
      }
      if (fileSize > this.MAX_IMAGE_SIZE) {
        throw new AppError(`Image exceeds maximum allowed size of ${this.MAX_IMAGE_SIZE / (1024 * 1024)}MB.`, 400, "FILE_TOO_LARGE");
      }
    } else if (fileType === "VIDEO") {
      const allowedVideos = ["video/mp4"];
      if (!allowedVideos.includes(mimeType)) {
        throw new AppError("Invalid video type. Allowed: MP4.", 400, "INVALID_FILE_TYPE");
      }
      if (fileSize > this.MAX_VIDEO_SIZE) {
        throw new AppError(`Video exceeds maximum allowed size of ${this.MAX_VIDEO_SIZE / (1024 * 1024)}MB.`, 400, "FILE_TOO_LARGE");
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;

    // 2. Upload to Cloudinary if configured
    if (useCloudinary) {
      try {
        const uploadResult = await new Promise<any>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: fileType === "VIDEO" ? "video" : "image" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        const fileUrl = uploadResult.secure_url;
        let thumbnailUrl = fileUrl;

        // Generate thumbnail for image/video using Cloudinary transformations
        if (fileType === "VIDEO") {
          thumbnailUrl = fileUrl.replace(/\.[^/.]+$/, ".jpg"); // replace ext with .jpg for video thumbnail
        } else {
          thumbnailUrl = cloudinary.url(uploadResult.public_id, {
            width: 300,
            height: 200,
            crop: "fill",
          });
        }

        return { fileUrl, thumbnailUrl };
      } catch (err: any) {
        console.error("Cloudinary upload failed, falling back to mock:", err.message);
      }
    }

    // 3. Upload to S3 if configured
    if (useS3 && s3Client) {
      try {
        const bucketName = process.env.AWS_BUCKET_NAME!;
        const uploadCommand = new PutObjectCommand({
          Bucket: bucketName,
          Key: fileName,
          Body: buffer,
          ContentType: mimeType,
        });

        await s3Client.send(uploadCommand);
        const fileUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${fileName}`;
        const thumbnailUrl = fileType === "VIDEO"
          ? "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=200&fit=crop" // Mock video thumbnail placeholder
          : fileUrl;

        return { fileUrl, thumbnailUrl };
      } catch (err: any) {
        console.error("S3 upload failed, falling back to mock:", err.message);
      }
    }

    // 4. Fallback Mock Upload
    console.log("No cloud storage configured, generating mock file response.");
    const base64 = buffer.toString("base64");
    const fileUrl = `data:${mimeType};base64,${base64}`;
    
    // Select a beautiful Unsplash placeholder based on type for visual display
    let thumbnailUrl = "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=300&h=200&fit=crop";
    if (fileType === "VIDEO") {
      thumbnailUrl = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=200&fit=crop";
    } else if (fileType === "PANORAMA") {
      thumbnailUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&h=200&fit=crop";
    }

    return { fileUrl, thumbnailUrl };
  }
}
