import { Platform } from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const isNativePlatform = Platform.OS !== "web";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type TokenGetter = () => string | null;
type RefreshFn = () => Promise<string | null>;

let getAccessToken: TokenGetter = () => null;
let refreshAccessToken: RefreshFn = async () => null;

/** Wired up by SessionProvider on mount so the API client can attach/refresh tokens without importing it directly (would create a circular import). */
export function configureApiClient(config: { getAccessToken: TokenGetter; refreshAccessToken: RefreshFn }): void {
  getAccessToken = config.getAccessToken;
  refreshAccessToken = config.refreshAccessToken;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH";
  body?: unknown;
  /** Skip attaching/refreshing the access token — used for the auth endpoints themselves. */
  skipAuth?: boolean;
}

async function rawRequest(path: string, options: RequestOptions, accessToken: string | null): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // Native has no cookie jar, so the access token travels as a header. Web
  // relies on the httpOnly access-token cookie the server sets instead.
  if (accessToken && isNativePlatform) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: isNativePlatform ? "omit" : "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = options.skipAuth ? null : getAccessToken();
  let response = await rawRequest(path, options, token);

  if (response.status === 401 && !options.skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      response = await rawRequest(path, options, newToken);
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { error?: string });
    throw new ApiError(response.status, body.error ?? `Request to ${path} failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

export const apiGet = <T>(path: string): Promise<T> => apiRequest<T>(path, { method: "GET" });

export const apiPost = <T>(path: string, body?: unknown, options?: { skipAuth?: boolean }): Promise<T> =>
  apiRequest<T>(path, { method: "POST", body, skipAuth: options?.skipAuth });

export const apiPatch = <T>(path: string, body?: unknown): Promise<T> =>
  apiRequest<T>(path, { method: "PATCH", body });
