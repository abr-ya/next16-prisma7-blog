import { SignInForm } from "@/components/index";
import { requireNoAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const SignInPage = async () => {
  await requireNoAuth();

  return <SignInForm />;
};

export default SignInPage;
