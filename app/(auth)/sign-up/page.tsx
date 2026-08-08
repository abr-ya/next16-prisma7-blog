import { SignUpForm } from "@/components/index";
import { isGithubAuthConfigured, isGoogleAuthConfigured } from "@/lib/auth-provider-config";
import { requireNoAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const SignUpPage = async () => {
  await requireNoAuth();

  return <SignUpForm isGithubConfigured={isGithubAuthConfigured()} isGoogleConfigured={isGoogleAuthConfigured()} />;
};

export default SignUpPage;
