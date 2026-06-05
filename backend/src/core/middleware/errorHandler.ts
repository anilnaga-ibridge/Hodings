import { NextRequest, NextResponse } from "next/server";
import { AppError } from "../errors/AppError";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function withErrorHandler(handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error: any) {
      console.error("[API Error Triggered]:", error);

      // Handle AppError
      const isAppError = error instanceof AppError || (error && typeof error === "object" && "statusCode" in error && "code" in error);
      if (isAppError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: error.code,
              message: error.message,
              details: error.details,
            },
          },
          { status: error.statusCode }
        );
      }

      // Handle Zod Validation Error
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_FAILED",
              message: "Provided fields fail validation checks.",
              details: error.issues.map((e: any) => ({
                field: e.path.join("."),
                issue: e.message,
              })),
            },
          },
          { status: 400 }
        );
      }

      // Handle Prisma Database Error
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "CONFLICT",
                message: "A database record with this field already exists.",
                details: error.meta,
              },
            },
            { status: 409 }
          );
        }
      }

      // Fallback Internal Server Error
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: error.message || "An unexpected system error occurred.",
            details: null,
          },
        },
        { status: 500 }
      );
    }
  };
}
