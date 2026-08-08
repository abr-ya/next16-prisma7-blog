import { AuthCard } from "./auth-card";

interface ISignUpFormProps {
  isGithubConfigured: boolean;
  isGoogleConfigured: boolean;
}

export const SignUpForm = ({ isGithubConfigured, isGoogleConfigured }: ISignUpFormProps) => (
  <AuthCard isSignIn={false} isGithubConfigured={isGithubConfigured} isGoogleConfigured={isGoogleConfigured} />
);
