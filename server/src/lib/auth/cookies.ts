import type { Response } from "express";

import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_EXPIRY_MS } from "./tokens.js";

export const ACCESS_COOKIE_NAME = "first_mate_access_token";
export const REFRESH_COOKIE_NAME = "first_mate_refresh_token";
export const REFRESH_COOKIE_PATH = "/api/auth";

const isProduction = process.env.NODE_ENV === "production";

/** Sets both auth cookies for web clients. Native clients ignore these and read the tokens from the response body instead. */
export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(ACCESS_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
    path: "/",
  });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
    path: REFRESH_COOKIE_PATH,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE_NAME, { path: "/" });
  res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
}
