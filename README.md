# AI Resume Match Platform

Production-ready monorepo foundation for an AI-powered resume and job matching platform.

The current app includes:

- `frontend/` - Next.js 15, React, TypeScript, Tailwind CSS.
- `backend/` - FastAPI REST API with JWT auth, resume upload, jobs, applications, resume parsing, and placeholder matching.
- `database/` - PostgreSQL initialization and migration SQL.
- `scripts/` - local setup helpers for Windows development.
- `docker-compose.yml` - optional Docker orchestration.

Pinecone, embeddings, production OpenAI integration, and Google OAuth are intentionally not implemented yet.

## Prerequisites

- Python 3.12 recommended
- Node.js 22+
- PostgreSQL installed locally
- npm

Docker is not required.

## Run Locally Without Docker

From the repository root:

```powershell
Copy-Item .env.example .env
```

Create the local PostgreSQL database and schema:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-local-postgres.ps1
```

If your PostgreSQL admin user is not `postgres`, pass it explicitly:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-local-postgres.ps1 -AdminUser your_admin_user
```

Create and install the backend environment:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

Start the FastAPI backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn --app-dir backend app.main:app --reload --host 0.0.0.0 --port 8000
```

In a second terminal, install and run the frontend:

```powershell
cd frontend
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open these URLs:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/api/v1/health
- Backend database health: http://localhost:8000/api/v1/health/db

## Project Structure

```text
.
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |-- core/
|   |   |-- models/
|   |   |-- schemas/
|   |   |-- services/
|   |   `-- main.py
|   |-- Dockerfile
|   `-- requirements.txt
|-- database/
|   |-- migrations/
|   `-- init.sql
|-- docs/
|   `-- 01-system-architecture.md
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- lib/
|   |-- package.json
|   `-- tailwind.config.ts
|-- scripts/
|   `-- setup-local-postgres.ps1
|-- docker-compose.yml
`-- README.md
```

## Useful Commands

Backend:

```powershell
.\.venv\Scripts\python.exe -m uvicorn --app-dir backend app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend:

```powershell
cd frontend
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Frontend typecheck:

```powershell
cd frontend
npm run typecheck
```

Frontend production build:

```powershell
cd frontend
npm run build
```

Optional Docker run, only if Docker Desktop is installed:

```bash
docker compose up --build
```

## Verification

After starting PostgreSQL, the backend, and the frontend, verify:

1. `http://localhost:3000` renders the platform shell.
2. `http://localhost:8000/api/v1/health` returns API status.
3. `http://localhost:8000/api/v1/health/db` returns PostgreSQL connectivity status.

## API Endpoints

Auth:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"recruiter@example.com\",\"full_name\":\"Demo Recruiter\",\"password\":\"password123\",\"role\":\"recruiter\"}"
```

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"recruiter@example.com\",\"password\":\"password123\"}"
```

Create a job using a recruiter or admin token:

```bash
curl -X POST http://localhost:8000/api/v1/jobs \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Backend Engineer\",\"company_name\":\"Acme\",\"description\":\"Build and operate production APIs for hiring workflows.\",\"requirements\":\"Python, FastAPI, PostgreSQL, Docker\",\"status\":\"active\"}"
```

List jobs:

```bash
curl http://localhost:8000/api/v1/jobs
```

Upload a resume using a candidate token:

```bash
curl -X POST http://localhost:8000/api/v1/resumes \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@resume.pdf"
```

Parse a resume:

```bash
curl -X POST http://localhost:8000/api/v1/resumes/<resume_id>/parse \
  -H "Authorization: Bearer <candidate_access_token>"
```

Create or recalculate a match result:

```bash
curl -X POST http://localhost:8000/api/v1/matches \
  -H "Authorization: Bearer <candidate_access_token>" \
  -H "Content-Type: application/json" \
  -d "{\"resume_id\":\"<resume_id>\",\"job_id\":\"<job_id>\"}"
```

Fetch an existing match result:

```bash
curl http://localhost:8000/api/v1/matches/resumes/<resume_id>/jobs/<job_id> \
  -H "Authorization: Bearer <candidate_access_token>"
```

## Frontend Pages

- Landing page: `http://localhost:3000`
- Login: `http://localhost:3000/login`
- Register: `http://localhost:3000/register`
- Candidate dashboard: `http://localhost:3000/candidate/dashboard`
- Resume upload: `http://localhost:3000/candidate/resume/upload`
- Jobs page: `http://localhost:3000/jobs`
- Job match result page: `http://localhost:3000/jobs/demo/match`
- Recruiter dashboard: `http://localhost:3000/recruiter/dashboard`

## Google Sign In

Google sign in is implemented, but it needs OAuth credentials from Google Cloud.

In Google Cloud Console:

1. Create or select a project.
2. Go to `APIs & Services` -> `OAuth consent screen` and configure the app.
3. Go to `APIs & Services` -> `Credentials`.
4. Create an `OAuth client ID`.
5. Choose `Web application`.
6. Add this authorized redirect URI:

```text
http://localhost:8000/api/v1/auth/google/callback
```

Add this authorized JavaScript origin:

```text
http://localhost:3000
```

Then update `.env`:

```text
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
WEB_URL=http://localhost:3000
```

Restart the backend after editing `.env`.
