"use client";

import { Github } from "lucide-react";
import Link from "next/link";
import { ReactNode, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

interface IAuthCardProps {
  children?: ReactNode;
  isSignIn?: boolean;
  isGithubConfigured: boolean;
  isGoogleConfigured: boolean;
}

type SocialProvider = "github" | "google";

const getAuthErrorMessage = (provider: SocialProvider, error?: { message?: string } | null) => {
  if (error?.message) return error.message;

  return provider === "github"
    ? "GitHub sign-in could not be started. Check the GitHub provider settings and try again."
    : "Google sign-in could not be started. Check the Google provider settings and try again.";
};

export const AuthCard = ({ isSignIn = true, children, isGithubConfigured, isGoogleConfigured }: IAuthCardProps) => {
  const title = isSignIn ? "Sign in to your account" : "Create a new account";
  const switchAuthLink = isSignIn ? "/sign-up" : "/sign-in";
  const switchAuthText = isSignIn ? "Sign up" : "Sign in";
  const doYouText = isSignIn ? "Do not have an account?" : "Already have an account?";
  const githubButtonText = isSignIn ? "Continue with GitHub" : "Sign up with GitHub";
  const googleButtonText = isSignIn ? "Continue with Google" : "Sign up with Google";
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const signInWithProvider = async (provider: SocialProvider) => {
    const isConfigured = provider === "github" ? isGithubConfigured : isGoogleConfigured;

    if (!isConfigured) {
      setErrorMessage(
        provider === "github"
          ? "GitHub sign-in is not configured for this environment."
          : "Google sign-in is not configured for this environment.",
      );
      return;
    }

    setPendingProvider(provider);
    setErrorMessage(null);

    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: provider === "github" ? "/admin" : "/",
      });

      if (result?.error) {
        setErrorMessage(getAuthErrorMessage(provider, result.error));
      }
    } catch {
      setErrorMessage(getAuthErrorMessage(provider));
    } finally {
      setPendingProvider(null);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {children ? <div>{children}</div> : null}

        {errorMessage ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}
        {!isGithubConfigured ? (
          <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
            GitHub sign-in is not configured for this environment.
          </p>
        ) : null}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            className="w-full cursor-pointer"
            disabled={pendingProvider !== null || !isGithubConfigured}
            onClick={() => signInWithProvider("github")}
          >
            {pendingProvider === "github" ? <Spinner /> : <Github className="size-4" />}
            {githubButtonText}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full cursor-pointer"
            disabled={pendingProvider !== null || !isGoogleConfigured}
            onClick={() => signInWithProvider("google")}
          >
            {pendingProvider === "google" ? <Spinner /> : null}
            {googleButtonText}
          </Button>
        </div>

        <Separator />

        <div className="flex justify-center text-sm">
          {doYouText}
          <Link href={switchAuthLink} className="ml-2 text-blue-900 underline">
            {switchAuthText}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
