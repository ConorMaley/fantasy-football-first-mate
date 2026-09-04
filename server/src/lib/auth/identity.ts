import type { OAuthProvider, User } from "@prisma/client";

import { prisma } from "../prisma.js";

export class UnverifiedAccountConflictError extends Error {
  constructor(email: string) {
    super(
      `An account already exists for ${email} but hasn't verified its email yet. Log in via OTP or magic link to verify it first.`,
    );
    this.name = "UnverifiedAccountConflictError";
  }
}

interface OAuthLink {
  provider: OAuthProvider;
  providerAccountId: string;
}

interface ResolveOptions {
  email: string;
  displayName?: string | null;
  oauth?: OAuthLink;
}

/**
 * Find-or-create the User for a *verified* email. The caller (OTP/magic-link
 * consumption, or a verified OAuth id token) is responsible for having
 * already proven ownership of `email` before calling this — this function
 * only encodes what happens next. Shared by every implicit signup-or-login
 * path so the auto-link rule lives in exactly one place: linking a new OAuth
 * account to an *existing* User is refused while that User is still
 * unverified, so an attacker who squatted the email via an unverified
 * password signup can't silently inherit the real owner's later OAuth
 * sign-in. OTP/magic-link consumption against an existing unverified User is
 * itself proof of ownership, so it verifies the account instead of refusing.
 */
export async function resolveUserForVerifiedEmail(options: ResolveOptions): Promise<User> {
  const { email, displayName, oauth } = options;

  if (oauth) {
    const existingAccount = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: oauth.provider,
          providerAccountId: oauth.providerAccountId,
        },
      },
      include: { user: true },
    });
    if (existingAccount) {
      return existingAccount.user;
    }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    if (existingUser.emailVerifiedAt === null) {
      if (oauth) {
        throw new UnverifiedAccountConflictError(email);
      }
      return prisma.user.update({
        where: { id: existingUser.id },
        data: { emailVerifiedAt: new Date() },
      });
    }

    if (oauth) {
      await prisma.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          provider: oauth.provider,
          providerAccountId: oauth.providerAccountId,
          email,
        },
      });
    }

    return existingUser;
  }

  return prisma.user.create({
    data: {
      email,
      displayName: displayName ?? null,
      emailVerifiedAt: new Date(),
      ...(oauth
        ? {
            oauthAccounts: {
              create: {
                provider: oauth.provider,
                providerAccountId: oauth.providerAccountId,
                email,
              },
            },
          }
        : {}),
    },
  });
}
