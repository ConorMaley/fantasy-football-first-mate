export interface OAuthIdentity {
  providerAccountId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
}
