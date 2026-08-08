import { SignInForm } from "@/components/index";
import { isGithubAuthConfigured, isGoogleAuthConfigured } from "@/lib/auth-provider-config";
import { requireNoAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const SignInPage = async () => {
  await requireNoAuth();

  return <SignInForm isGithubConfigured={isGithubAuthConfigured()} isGoogleConfigured={isGoogleAuthConfigured()} />;
};

export default SignInPage;
