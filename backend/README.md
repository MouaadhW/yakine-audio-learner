# Yakine Audio Learner Backend

Express + Prisma + PostgreSQL backend for courses, audio lessons, user progress, and downloads.

## Stack
- Node.js + Express
- PostgreSQL
- Prisma ORM
- JWT + bcrypt
- S3/R2-ready storage config

## 1) Setup
1. Copy env file:
   - Windows PowerShell: `Copy-Item .env.example .env`
2. Update `.env` values (`DATABASE_URL`, `JWT_SECRET`, etc.)
3. Install dependencies:
   - `npm install`
4. Generate Prisma client:
   - `npm run prisma:generate`
5. Run migrations:
   - `npm run prisma:migrate`

## 2) Run
- Development: `npm run dev`
- Build: `npm run build`
- Production: `npm start`

Health check: `GET /health`

## 3) Main APIs
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/subjects`
- `POST /api/subjects` (TEACHER/ADMIN)
- `GET /api/lessons`
- `GET /api/lessons/:id`
- `POST /api/lessons` (TEACHER/ADMIN)
- `GET /api/progress`
- `POST /api/progress`
- `GET /api/downloads`
- `POST /api/downloads`
- `GET /api/storage/config`

Use `Authorization: Bearer <token>` for protected routes.
