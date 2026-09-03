import type { NextFunction, Request, Response } from "express";

import { ACCESS_COOKIE_NAME } from "../lib/auth/cookies.js";
import { verifyAccessToken } from "../lib/auth/jwt.js";

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

function extractAccessToken(req: Request): string | undefined {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return req.cookies?.[ACCESS_COOKIE_NAME];
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractAccessToken(req);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    req.userId = verifyAccessToken(token).sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
}
