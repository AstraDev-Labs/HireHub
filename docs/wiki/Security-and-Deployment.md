# Security and Deployment

## Security Controls
HireHub includes several defensive controls:
- Helmet security headers
- global, auth, and upload rate limiting
- CSRF token issuance and validation
- request sanitization and HPP protection
- strict environment validation at startup
- crash logging and early exception/rejection handling

## Dependency Hygiene
Keep dependencies current, especially upload and auth-related packages. Security alerts should be reviewed quickly and patched with lockfile updates when required.

## Deployment Notes
### Frontend
- deployed as a Next.js app
- requires `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SITE_URL`
- Turbopack and output tracing roots should stay aligned in monorepo-style deployments

### Backend
- requires runtime secrets and AWS configuration
- cluster mode is available for production process resilience
- ensure upload, email, and database dependencies are configured before go-live

## Operational Checks
Before release:
- run frontend production build
- verify backend starts without environment errors
- validate login/logout flow
- verify challenge execution console and submissions
- verify upload endpoints
- verify sitemap and robots generation

## Incident Handling
For auth or API failures:
- inspect browser network responses
- inspect backend logs and `crash.log`
- confirm environment variables and deployment URLs match
- confirm stale client tokens are cleared without breaking public pages
