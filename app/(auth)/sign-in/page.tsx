import { SignInForm } from "@/components/index";
import { requireNoAuth } from "@/lib/auth-utils";

const SignInPage = async () => {
  await requireNoAuth();

  return <SignInForm />;
};

export default SignInPage;
