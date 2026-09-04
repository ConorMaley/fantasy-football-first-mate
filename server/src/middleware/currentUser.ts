import type { NextFunction, Request, Response } from "express";

import { resolveCurrentUserId } from "../lib/currentUser.js";

export async function currentUserMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    req.currentUserId = await resolveCurrentUserId();
    next();
  } catch (err) {
    next(err);
  }
}
