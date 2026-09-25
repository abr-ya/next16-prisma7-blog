import prisma from "./prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { AUTH_ROLES } from "./auth-roles";
import { AUTH_TRUST_LEVELS } from "./auth-trust";
import type { TrustChangeSource, UserTrustLevel } from "@/generated/prisma/client";
import { getGithubOAuthCredentials, getGoogleOAuthCredentials } from "./auth-provider-config";

const githubOAuthCredentials = getGithubOAuthCredentials();
const googleOAuthCredentials = getGoogleOAuthCredentials();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    ...(googleOAuthCredentials
      ? {
          google: {
            ...googleOAuthCredentials,
            prompt: "select_account",
          },
        }
      : {}),
    ...(githubOAuthCredentials
      ? {
          github: {
            ...githubOAuthCredentials,
            prompt: "select_account",
          },
        }
      : {}),
  },
  plugins: [
    admin({
      defaultRole: AUTH_ROLES.USER,
      adminRoles: [AUTH_ROLES.ADMIN],
    }),
    nextCookies(),
  ],
  databaseHooks: {
    user: {
      create: {
        // OAuth signups arrive with `emailVerified = true` (the provider verified the email).
        // Email/password signups arrive with `emailVerified = false`. We use that signal to
        // decide the initial trust level, then write a single TrustChangeLog row.
        // Failures in the audit write must never block signup.
        after: async (createdUser) => {
          const isOAuthSignup = createdUser.emailVerified === true;
          const trustLevel: UserTrustLevel = isOAuthSignup ? AUTH_TRUST_LEVELS.VERIFIED : AUTH_TRUST_LEVELS.NEW;
          const source: TrustChangeSource = isOAuthSignup ? "OAUTH_SIGNUP" : "SYSTEM_INIT";

          try {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: createdUser.id },
                data: { trustLevel },
              }),
              prisma.trustChangeLog.create({
                data: {
                  targetUserId: createdUser.id,
                  fromLevel: AUTH_TRUST_LEVELS.NEW,
                  toLevel: trustLevel,
                  source,
                },
              }),
            ]);
          } catch (error) {
            // never block signup on audit failure
            console.warn("[auth] trust change log write failed", error);
          }
        },
      },
    },
  },
});
