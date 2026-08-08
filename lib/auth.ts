import prisma from "./prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { AUTH_ROLES } from "./auth-roles";
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
});
