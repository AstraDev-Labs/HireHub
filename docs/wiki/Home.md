# HireHub Wiki

Welcome to the HireHub wiki. This space documents the platform architecture, setup flow, major modules, and operational practices for the Campus Placement Management System.

## Overview
HireHub is a full-stack campus placement platform built for students, companies, staff, and administrators. It supports role-based workflows, placement drives, interviews, resources, coding challenges, notifications, messaging, and reporting.

## Core Features
- Role-based access control for Admin, Staff, Company, Parent, and Student users
- Placement drives and application lifecycle tracking
- Interview scheduling and company coordination
- Coding challenges with execution and submission review
- Resume and resource uploads through AWS-backed storage
- Dashboard analytics and reporting
- End-to-end encrypted messaging and notifications
- Security protections including CSRF, rate limiting, sanitization, and strict environment validation

## Wiki Pages
- [Getting Started](./Getting-Started.md)
- [Architecture](./Architecture.md)
- [Security and Deployment](./Security-and-Deployment.md)

## Repository Structure
- `frontend/`: Next.js application
- `src/`: Express backend source
- `api/`: serverless/API entrypoints and related integration code
- `scripts/`: utility and maintenance scripts
- `uploads/`: local uploaded assets used in some environments

## Recommended Reading Order
1. Getting Started
2. Architecture
3. Security and Deployment

## Maintainers
This wiki should be updated whenever authentication, deployment, infrastructure, challenge execution, or role workflows change.
