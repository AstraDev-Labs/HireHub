# Campus Placement Management System (CPMS)

A full-stack placement management platform built with Node.js, Express, MongoDB, Next.js, and Tailwind CSS.

## Features
- **Authentication**: JWT-based auth with Role-Based Access Control (Admin, Staff, Company, Student).
- **Dashboard**: Real-time statistics on placements.
- **Student Management**: Track student details and placement status.
- **Company Management**: Manage companies and interview rounds.
- **Resources**: Share and access preparation materials.
- **Audit Logs**: Comprehensive logging of all actions.

## Tech Stack
- **Backend**: Node.js, Express, Mongoose, MongoDB
- **Frontend**: Next.js 14, React, Tailwind CSS, Lucide Icons, Shadcn UI (Custom implementation)
- **Database**: MongoDB Atlas (or local)

## Getting Started

### Prerequisites
- Node.js installed
- MongoDB installed or Atlas URI

### Installation

1. **Install Dependencies**
   ```bash
   # Install backend dependencies
   npm install

   # Install frontend dependencies (automatically handled by concurrently script if needed, or run separately)
   cd frontend
   npm install
   cd ..
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env` in the root directory.
   - Update `SYSTEM_DB_URI` and `LOGS_DB_URI` with your MongoDB connection strings.
   - Frontend uses `http://localhost:5000/api` by default.

3. **Seed Database (Optional)**
   Populate the database with initial data (Admin, Student, Company).
   ```bash
   npm run seed
   ```
   **Default Credentials:**
   - Admin: `admin@cpms.com` / `password123`
   - Student: `student@test.com` / `password123`
   - Staff: `staff@test.com` / `password123`

### Running the Application

You can run both backend and frontend concurrently with a single command:

```bash
npm run dev:all
```

Or run them geographically:
- **Backend**: `npm run dev` (Runs on port 5000)
- **Frontend**: `npm run dev:client` (Runs on port 3000)

## API Documentation
The API is available at `http://localhost:5000/api`.
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/students`
- ...and more.

## License
MIT
