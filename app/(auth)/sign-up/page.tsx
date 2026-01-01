import { SignUpForm } from "@/components/index";
import { requireNoAuth } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

const SignUpPage = async () => {
  await requireNoAuth();

  return <SignUpForm />;
};

export default SignUpPage;
