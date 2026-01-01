"use client";

import { authClient } from "@/lib/auth-client";
import { Button, Card, CardContent, CardHeader, CardTitle, Separator } from "..";
import { ReactNode } from "react";
import Link from "next/link";

interface IAuthCardProps {
  children: ReactNode;
  isSignIn?: boolean;
}

export const AuthCard = ({ isSignIn = true, children }: IAuthCardProps) => {
  const title = isSignIn ? "Sign in to your account" : "Create a new account";
  const switchAuthLink = isSignIn ? "/sign-up" : "/sign-in";
  const switchAuthText = isSignIn ? "Sign up" : "Sign in";
  const doYouText = isSignIn ? "Do not have an account?" : "Already have an account?";

  // Social Sign In (and Sign Up!) Handlers
  const signInWithGithub = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  const signInWithGoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {children}

        <Separator />

        <div className="flex justify-center my-4">
          {doYouText}
          <Link href={switchAuthLink} className="text-blue-900 ml-2 underline">
            {switchAuthText}
          </Link>
        </div>

        <Separator />

        <div className="flex justify-center gap-2">
          <Button type="button" className="text-[13px] cursor-pointer" onClick={signInWithGithub}>
            Continue with Github
          </Button>
          <Button type="button" className="text-[13px] cursor-pointer" onClick={signInWithGoogle}>
            Continue with Google
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
