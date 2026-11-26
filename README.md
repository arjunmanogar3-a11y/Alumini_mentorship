# Alumni Network and Mentorship Portal

A starter full-stack MCA mini project using React + Vite, Node.js, Express, and MongoDB.

## Features
- Student/alumni registration and login
- JWT authentication and role-based access
- Alumni profile listing and search
- Mentorship requests (students request; alumni accept/reject)
- Job/internship listings
- Simple dashboard
- Demo seed script for sample jobs

## Requirements
- Node.js LTS (includes npm)
- MongoDB Community Server running locally OR a MongoDB Atlas connection string
- VS Code (recommended)

## Setup (Windows)
1. Install Node.js LTS from https://nodejs.org/
2. Install MongoDB Community Server from https://www.mongodb.com/try/download/community, or create an Atlas cluster at https://www.mongodb.com/cloud/atlas.
3. Extract the ZIP to a folder such as `C:\\Projects\\alumni-mentorship-portal`.
4. Open that folder in VS Code.
5. Copy `backend/.env.example` to `backend/.env`.
6. Edit `backend/.env`:
   - For local MongoDB, keep `MONGODB_URI=mongodb://127.0.0.1:27017/alumni_portal`
   - Set a long random `JWT_SECRET`.
7. Open a terminal in the project folder and run:
   ```bash
   npm install
   npm run install:all
   ```
8. Start the app:
   ```bash
   npm run dev
   ```
9. Open the frontend at http://localhost:5173

The backend runs at http://localhost:5000. You need MongoDB running before using the API.

## How to test
1. Register a user with role `student`.
2. Register another account with role `alumni`.
3. Log in as alumni and complete the profile fields.
4. Log in as student, search alumni, and request mentorship.
5. Log in as the alumni account and accept/reject the request.
6. Add a job using the jobs page form (alumni/admin only).

## Notes
- This is an educational starter project, not production-ready.
- Keep `.env` private; do not upload it to GitHub.
- The first registered account can select `admin` only for local classroom testing. For real deployments, remove public admin registration and create admins securely.
- If a port is already in use, stop the other application or change the port in the relevant config.
