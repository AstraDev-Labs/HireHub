# Architecture

## High-Level Design
HireHub uses a split frontend/backend architecture:
- Frontend: Next.js app in `frontend/`
- Backend: Express app in `src/`
- Data layer: Amazon DynamoDB
- File storage: Amazon S3

## Frontend
The frontend is responsible for:
- authentication UX
- role-specific dashboards
- public landing pages and SEO routes
- challenge IDE and submission flows
- company, student, drive, interview, and notification interfaces

Important locations:
- `frontend/app/`: route-based pages
- `frontend/components/`: reusable UI
- `frontend/context/`: auth and shared state providers
- `frontend/lib/`: API client and helpers

## Backend
The backend handles:
- authentication and authorization
- validation and security middleware
- placement and interview workflows
- resource and resume upload handling
- challenge execution orchestration
- notifications and reporting

Important locations:
- `src/server.js`: backend bootstrap
- `src/routes/`: API routing
- `src/controllers/`: request handlers
- `src/middlewares/`: security and request middleware
- `src/models/` or data-access modules: persistence logic

## Authentication Flow
- frontend stores non-sensitive session hints and calls backend APIs with cookies and token compatibility headers
- backend validates session state and role permissions
- refresh-token handling is centralized in the frontend API client
- public pages must not hard-redirect on stale local auth state

## Key Domains
- Students
- Companies
- Placement Drives
- Interviews
- Challenges
- Resources
- Notifications
- Reports
