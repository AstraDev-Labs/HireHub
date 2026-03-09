# Getting Started

## Prerequisites
- Node.js 18+
- npm
- AWS credentials for DynamoDB and S3
- Environment variables configured for backend and frontend

## Install
```bash
npm install
cd frontend
npm install
cd ..
```

## Environment Setup
Create a root `.env` from `.env.example` and configure at minimum:
- `PORT`
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL`
- JWT and refresh token secrets
- AWS region, credentials, DynamoDB table settings, and S3 bucket settings
- SMTP or email provider settings if email flows are enabled

## Run Locally
Backend only:
```bash
npm run dev
```

Frontend only:
```bash
npm run dev:client
```

Full stack:
```bash
npm run dev:all
```

## Production Start
```bash
npm run start:cluster
```

## First Checks
After startup, verify:
- frontend loads successfully
- backend `/api/healthz` responds
- authentication works
- dashboard data loads
- uploads and challenge execution are reachable in the target environment
