# HireHub Development Roadmap

This document outlines the planned trajectory for HireHub, identifying future features, architecture upgrades, and milestones across upcoming versions.

---

## 🚀 [v1.1.0] - The "Insights" Update (Upcoming)
**Focus:** Enhancing analytics, reporting, and automated notifications.
### Planned Features:
- **Advanced Exporting:** Export placement data and student lists to CSV/Excel directly from the dashboard.
- **Automated Email Triggers:** Send automated dynamic email notifications to students when interview statuses change (e.g., Shortlisted, Selected, Rejected).
- **Customizable Dashboards:** Allow Admin and Staff to customize the widgets on their dashboards.
- **Company Feedback Loop:** Introduce a portal for companies to leave immediate feedback on candidates post-interview.

---

## 🛡️ [v1.2.0] - The "Zero Trust" Update
**Focus:** Enterprise-grade security and secret management.
### Planned Features:
- **HashiCorp Vault Integration:** Transition from static `.env` files to dynamic, identity-based secret management for DB and AWS credentials.
- **Enhanced Encryption at Rest:** Implement field-level encryption for sensitive student data in DynamoDB using Vault's transit engine.
- **Advanced Audit Logging:** Secure, tamper-proof audit trails for all administrative actions.
- **GitHub Security Policy:** Formalized vulnerability reporting and security lifecycle management.

---

## 📱 [v1.5.0] - The "Mobile Access" Update
**Focus:** Extending the platform accessibility beyond the mobile web interface.
### Planned Features:
- **Progressive Web App (PWA) Support:** Enable students and staff to install the web application on their phones for offline capabilities and faster load times.
- **Push Notifications:** Introduce browser and mobile push notifications for real-time alerts regarding new resources, messages, and interview schedules.
- **In-App Calendar Integration:** Allow directly syncing interview timings with Google Calendar or Apple Calendar.

---

## 🧠 [v2.0.0] - The "Smart Matching" Update
**Focus:** Introducing AI/ML features to streamline the recruitment processing.
### Planned Features:
- **AI Resume Parsing (ATS):** Automatically extract key skills, CGPA, and project details from uploaded resumes string matching to standard job descriptions.
- **Intelligent Job Recommendations:** Suggest relevant companies to students based on their portfolio and academic history.
- **Automated Interview Prep:** A dedicated AI chatbot within the Resources tab to help students practice common interview questions for specific roles.
- **Video Assessments:** Built-in asynchronous video interview recording for initial screening rounds.

---

## 🌐 [v2.5.0] - The "Ecosystem" Update
**Focus:** Integration with external learning platforms and expanding the ecosystem.
### Planned Features:
- **LinkedIn Integration:** Allow students to sync their LinkedIn profiles directly with their HireHub profiles.
- **Coursera/Udemy Badges:** Automatic verifying and displaying of certificates from major learning platforms.
- **Alumni Mentorship Network:** Introduce an 'Alumni' role, allowing graduated students to mentor current students and share referral links.

---

*Note: This roadmap is subject to change based on user feedback, placement season requirements, and technological advancements.*
