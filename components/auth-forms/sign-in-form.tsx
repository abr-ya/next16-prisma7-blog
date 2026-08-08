import { AuthCard } from "./auth-card";

interface ISignInFormProps {
  isGithubConfigured: boolean;
  isGoogleConfigured: boolean;
}

export const SignInForm = ({ isGithubConfigured, isGoogleConfigured }: ISignInFormProps) => (
  <AuthCard isGithubConfigured={isGithubConfigured} isGoogleConfigured={isGoogleConfigured} />
);
