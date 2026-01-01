import { SignUpForm } from "@/components/index";
import { requireNoAuth } from "@/lib/auth-utils";

const SignUpPage = async () => {
  await requireNoAuth();

  return <SignUpForm />;
};

export default SignUpPage;
