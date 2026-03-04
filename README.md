# HireHub - Campus Placement Management System (CPMS)

HireHub is a comprehensive, full-stack placement management platform designed to streamline the campus recruitment process. Built with modern web technologies, it offers a secure, highly concurrent, and mobile-responsive experience for Students, Companies, Staff, and Administrators.

## 🚀 Key Features
- **Role-Based Access Control (RBAC)**: Secure access for Admin, Staff, Company, and Student roles with fine-grained permissions.
- **High Concurrency Stability**: Engineered with Node.js clustering and connection pooling to handle 10,000+ simultaneous connections during peak registration events.
- **Mobile-First Design**: Fully responsive UI featuring off-canvas navigation tabs, fluid data tables, and adaptive messaging layouts for seamless use on any device.
- **End-to-End Encrypted Messaging**: Secure direct messaging and announcements using RSA encryption.
- **Advanced Security Architecture**: Hardened with 3-tier rate limiting, CSRF protection, comprehensive input sanitization, and strict environment variable enforcement.
- **Real-Time Dashboards & Analytics**: Insightful statistics and charts for monitoring placement drives and application statuses.
- **Resource Management**: Secure AWS S3 integration for sharing preparation materials and managing student resumes.

## 🛠 Tech Stack
- **Frontend**: Next.js 14, React 19, Tailwind CSS v4, Shadcn UI, Framer Motion
- **Backend**: Node.js, Express, AWS SDK (DynamoDB & S3), Clustering
- **Database**: Amazon DynamoDB
- **Storage**: Amazon S3
- **Security**: Helmet, Express Rate Limit, CSRF, DOMPurify, Bcrypt, JWT

## 🏁 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- AWS Account with DynamoDB and S3 bucket configured

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/AstraDev-Labs/HireHub.git
   cd HireHub
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```

3. **Environment Configuration**
   - Copy `.env.example` to `.env` in the root directory.
   - Configure your AWS credentials, JWT secrets, and Email settings.
   - **Crucial**: Set `NEXT_PUBLIC_API_URL` and `FRONTEND_URL` to your production URLs before deploying.

4. **Running the Application**
   - **Development**: Run both backend and frontend concurrently:
     ```bash
     npm run dev:all
     ```
   - **Production (Clustered)**: 
     ```bash
     npm run start:cluster
     ```

## 📄 Documentation
- Please see `VERSION.md` for the current active version.
- Please see `UPDATES.md` for a log of recent optimizations and feature additions.

## 🔒 Security Note
This application has been stripped of local environment fallbacks to ensure production safety. You must provide valid environment variables via your hosting provider (e.g., Vercel, Render) for the application to function over the network.
