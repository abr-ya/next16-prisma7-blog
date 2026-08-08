import "server-only";

const PLACEHOLDER_VALUES = new Set([
  "",
  "your-github-client-id",
  "your-github-client-secret",
  "your-google-client-id",
  "your-google-client-secret",
]);

const isConfiguredValue = (value: string) => Boolean(value && !PLACEHOLDER_VALUES.has(value));

const getOAuthCredentials = (clientId: string | undefined, clientSecret: string | undefined) => {
  const trimmedClientId = clientId?.trim() ?? "";
  const trimmedClientSecret = clientSecret?.trim() ?? "";

  if (!isConfiguredValue(trimmedClientId) || !isConfiguredValue(trimmedClientSecret)) return null;

  return {
    clientId: trimmedClientId,
    clientSecret: trimmedClientSecret,
  };
};

export const getGithubOAuthCredentials = () =>
  getOAuthCredentials(process.env.GITHUB_CLIENT_ID, process.env.GITHUB_CLIENT_SECRET);

export const getGoogleOAuthCredentials = () =>
  getOAuthCredentials(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

export const isGithubAuthConfigured = () => Boolean(getGithubOAuthCredentials());

export const isGoogleAuthConfigured = () => Boolean(getGoogleOAuthCredentials());
