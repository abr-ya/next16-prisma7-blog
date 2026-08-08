# GitHub OAuth Credentials Setup

This note describes how to create GitHub OAuth credentials for local or production environments. The credentials are required only when manually validating the live GitHub sign-in and sign-up flow.

## Local Development

1. Open GitHub Developer settings.
2. Go to **OAuth Apps**.
3. Create a new OAuth App.
4. Use a clear application name, for example `Next16 Prisma7 Blog Local`.
5. Set **Homepage URL** to `http://localhost:3000`.
6. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`.
7. Create the app, then copy the generated client ID.
8. Generate a new client secret and copy it immediately.

Add the credentials to the local `.env` file:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
BETTER_AUTH_URL=http://localhost:3000
```

Restart the local dev server after changing OAuth environment variables.

## Production

Create a separate GitHub OAuth App for production instead of reusing local credentials.

Use the production origin for both URLs:

```text
Homepage URL: https://your-domain.example
Authorization callback URL: https://your-domain.example/api/auth/callback/github
```

Store production credentials only in the deployment environment secret store.

## Manual Verification

After credentials are configured:

1. Start the app with the target environment values.
2. Open `/sign-in` and start GitHub authentication.
3. Confirm the GitHub callback returns to `/admin`.
4. Sign out, then open `/sign-up` and start GitHub authentication with an account that can create or reuse a user according to Better Auth rules.
5. Confirm GitHub-authenticated users keep the ordinary `user` role unless separately promoted by the app.
6. Confirm missing or invalid credentials show a generic UI error and do not expose provider secrets.

The planned feature `feature-063-github-oauth-credentials-validation` owns creating environment-specific credentials and performing this live verification as a dedicated follow-up.
