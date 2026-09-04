/// The single seam standing in for real session auth (being built separately).
/// Swapping this to read a real session/JWT should require no changes to any
/// route or service that calls it.
export const DEV_USER_ID = "dev-user";

export function getCurrentUserId(): string {
  return DEV_USER_ID;
}
