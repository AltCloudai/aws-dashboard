# CloudControl backend

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `CLOUDCONTROL_API_TOKEN` to a random value of at least 32 bytes. For example, generate one with:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

3. Configure AWS credentials using an IAM role or the AWS SDK credential provider chain (such as an AWS profile/SSO). Do not commit credentials or put long-lived AWS access keys in source control.
4. Start the backend with `npm run dev` or `npm start`.
5. Enter the API token in the frontend's Backend Access section. The frontend keeps it in memory only.

The backend binds to `127.0.0.1` by default. Set `HOST` explicitly only when you intend to expose it on another interface. Set `CORS_ORIGINS` to a comma-separated list of exact frontend origins; the default is `http://localhost:5173`. CORS is not authentication: all `/api` routes, including health, also require the bearer token.

This shared-token setup is intended for a private, single-admin tool, not a public multi-user service. Use a proper identity provider and user-level authorization before exposing it beyond a trusted local environment.

Keep `.env` private. The backend `.gitignore` excludes `.env` and other `.env.*` files while allowing this placeholder-only `.env.example`.
