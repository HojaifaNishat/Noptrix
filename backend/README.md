## Backend deployment

The production image is built from the backend directory:

```sh
docker build -t noptrix-backend .
```

Provide runtime configuration through a secret manager or an uncommitted
environment file. Production startup requires MongoDB and Redis; use a MongoDB
replica set for transaction-backed workflows. Production environment validation
requires HTTPS CORS origins, a public HTTPS `APP_URL`, distinct JWT secrets, and
`COOKIE_SECURE=true`. Online payments remain disabled unless a provider and its
webhook and HTTPS callback configuration are explicitly supplied.

The image health check uses `GET /api/health/live`. Configure the deployment
platform's readiness probe to use `GET /api/health/ready`; it returns `503`
unless both MongoDB and Redis respond as healthy.

### Preparing production environment

Start from `.env.production.example` and create an untracked `.env.production`
or, preferably, configure the same values in your deployment platform's secret
manager. The example is intentionally incomplete: production startup must fail
until real public URLs, a MongoDB replica-set URI, a private Redis URL, exact
HTTPS CORS origins, and two independent JWT secrets are supplied. Keep
`COOKIE_SECURE=true`. Set `COOKIE_DOMAIN` only when the frontend and API need a
shared parent-domain cookie; otherwise leave it empty.

Generate JWT secrets independently with a cryptographically secure generator,
for example `openssl rand -base64 48`, and store them only in the secret manager.
Do not commit `.env.production`, use development credentials, or reuse the same
secret for both tokens. Online payments are off by default; leave them disabled
until a provider, its credentials, HTTPS callbacks, and webhook verification
have been configured and tested in that provider's sandbox.

Run the backend checks before building:

```sh
npm ci
npm run lint
npm run format:check
npm test
npm run typecheck
npm run build
npm audit
```

`docker-compose.yml` provisions Redis for local development only. Its published
port is bound to loopback; production deployments should use a protected,
private Redis endpoint.
