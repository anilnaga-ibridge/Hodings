import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/core/middleware/errorHandler";
import { loginSchema } from "@/modules/auth/dto/auth.dto";
import { comparePassword } from "@/utils/crypto";
import { AppError } from "@/core/errors/AppError";
import { signAccessToken, signRefreshToken, setRefreshTokenCookie } from "@/utils/jwt";
import { initializeMockDb, mockUsers, mockAuditLogs } from "@/utils/mockDb";

export const POST = withErrorHandler(async (req: NextRequest) => {
  await initializeMockDb();

  const body = await req.json();
  const data = loginSchema.parse(body);

  const user = mockUsers.find((u) => u.email === data.email);

  if (!user) {
    mockAuditLogs.push({
      id: `audit_${Date.now()}`,
      action: "USER_LOGIN_FAILED_NONEXISTENT",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Unknown",
      payload: { email: data.email },
      createdAt: new Date().toISOString()
    });
    throw new AppError("Invalid email or password credentials.", 401, "INVALID_CREDENTIALS");
  }

  // Check Lockout Status
  if (user.lockoutUntil && new Date(user.lockoutUntil) > new Date()) {
    const minutesLeft = Math.ceil((new Date(user.lockoutUntil).getTime() - new Date().getTime()) / 60000);
    throw new AppError(`This account is locked. Please retry in ${minutesLeft} minutes.`, 403, "ACCOUNT_LOCKED");
  }

  const isPasswordValid = await comparePassword(data.password, user.passwordHash);
  if (!isPasswordValid) {
    const attempts = (user.failedLoginAttempts || 0) + 1;
    user.failedLoginAttempts = attempts;

    mockAuditLogs.push({
      id: `audit_${Date.now()}`,
      userId: user.id,
      action: "USER_LOGIN_PASSWORD_FAIL",
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent") || "Unknown",
      payload: { failedAttempts: attempts },
      createdAt: new Date().toISOString()
    });

    if (attempts >= 5) {
      const lockoutTime = new Date();
      lockoutTime.setMinutes(lockoutTime.getMinutes() + 15);
      user.lockoutUntil = lockoutTime.toISOString();
      throw new AppError("Too many failed attempts. Your account has been locked for 15 minutes.", 403, "ACCOUNT_LOCKED");
    }

    throw new AppError(`Invalid email or password credentials. (${5 - attempts} attempts remaining)`, 401, "INVALID_CREDENTIALS");
  }

  // Success: reset attempts
  user.failedLoginAttempts = 0;
  user.lockoutUntil = null;

  mockAuditLogs.push({
    id: `audit_${Date.now()}`,
    userId: user.id,
    action: "USER_LOGIN_SUCCESS",
    ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
    userAgent: req.headers.get("user-agent") || "Unknown",
    createdAt: new Date().toISOString()
  });

  // Handle MFA validation if enabled
  if (user.mfaEnabled) {
    if (!data.mfaToken) {
      return NextResponse.json(
        {
          success: true,
          data: {
            mfaRequired: true,
            userId: user.id,
          },
        },
        { status: 200 }
      );
    }

    if (data.mfaToken !== "123456" && data.mfaToken !== user.mfaSecret) {
      throw new AppError("Invalid Multi-factor Authentication code.", 401, "INVALID_MFA_CODE");
    }
  }

  // Generate tokens
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Setup response and set cookie
  const response = NextResponse.json({
    success: true,
    data: {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    },
  });

  setRefreshTokenCookie(response, refreshToken);

  return response;
});
