import { NextRequest } from "next/server";
import { AppError } from "../errors/AppError";
import { verifyAccessToken, JWTPayload } from "@/utils/jwt";

export function getAuthenticatedUser(req: NextRequest): JWTPayload {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Access token is missing or malformed.", 401, "UNAUTHORIZED");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = verifyAccessToken(token);
    return decoded;
  } catch (error) {
    throw new AppError("Access token has expired or is invalid.", 401, "TOKEN_EXPIRED");
  }
}

export function authorizeRoles(user: JWTPayload, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new AppError("You do not have permission to access this resource.", 403, "FORBIDDEN");
  }
}
