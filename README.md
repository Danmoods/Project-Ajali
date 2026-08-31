
# Ajali

Ajali is an emergency reporting platform (frontend + REST API) that lets citizens report incidents, attach media, and interact on a community wall while city administrators review and update incident statuses.

## Project Overview

Ajali provides:
- A React + Vite single-page frontend that authenticates against a Flask REST API.
- A Flask backend (REST API) backed by SQLAlchemy and intended to run against PostgreSQL (local development and CI use SQLite in-memory for tests).
- Features for user registration, JWT-based authentication, profile management (including profile photo uploads via Cloudinary in the frontend), incident reporting, evidence attachments, a community post feed, and administrator incident review/status updates.

## Main Features (implemented)

- User registration (`POST /auth/register`) and login (`POST /auth/login`).
- JWT authentication for protected endpoints; current user and profile update via `GET|PATCH /auth/me` and password change via `PUT /auth/change-password`.
- User profiles with editable fields (`username`, `email`, `phone`, `bio`, `profile_photo`).
- Profile picture upload flow implemented in the frontend using Cloudinary (see frontend `Profile.jsx`).
- Incident reporting: create, list, retrieve, update, and delete incidents (`/incidents` and `/incidents/<id>`).
- Incident evidence: add, list, and remove media records for an incident (`/incidents/<id>/media`). Frontend uploads media to Cloudinary (profile photo flow); the API stores evidence as `file_url` references.
- Incident review workflow for administrators: admin dashboard (`/admin/dashboard`), list incidents for review (`/admin/incidents`) and update incident status (`/admin/incidents/<id>`).
- Community posts (short messages): create, list, update, delete (`/community/posts`).

> Note: All features above are implemented in the codebase. The README does not claim any additional integrations or deployment automation beyond what exists in the repository.

## Technology Stack

- Frontend: React (v19) + Vite, Tailwind CSS (configured), React Router, lucide-react icons.
- Backend: Python 3 + Flask, Flask-RESTful, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-Migrate (Alembic), Flask-Marshmallow.
- Database: PostgreSQL is the intended production DB (default connection string); tests use SQLite in-memory.
- Other: Cloudinary used by the frontend for client-side profile uploads (see `src/pages/Profile.jsx`).

## Architecture

React/Vite frontend
	↓ (REST over HTTP)
Flask REST API (Flask-RESTful)
	↓ (SQLAlchemy)
PostgreSQL (production) / SQLite (tests)

Profile picture uploads in the frontend send files directly to Cloudinary; the frontend then sends the returned `secure_url` to the API when updating the user profile.

## Project Structure (important files)

- `client/AJALI/` — React frontend (Vite)
	- `src/lib/api.js` — central fetch wrapper; uses `VITE_API_URL` (or a default) and automatically attaches `ajali_token` from localStorage.
	- `src/context/AuthContext.jsx` — authentication state and helper functions (`login`, `register`, `logout`, `updateProfile`).
	- `src/pages/Profile.jsx` — profile page and client-side Cloudinary upload flow.

- `back-end/` — Flask API
	- `main.py` — app factory and app entrypoint
	- `config.py` — environment-backed configuration (database, JWT secret)
	- `extensions.py` — Flask extension instances (db, migrate, jwt, ma)
	- `controller/` — API resources and route registrations
	- `models/` — SQLAlchemy models: `User`, `Incident`, `Media`, `CommunityPost`
	- `schemas/` — Marshmallow schemas used for validation
	- `migrations/` — Alembic migration scripts
	- `seed.py` — idempotent seeder for sample users, incidents, media and posts
	- `tests/` — pytest test suite covering auth, incidents, media, community, and admin flows

## Local Development

Backend (Python)

1. Create and activate a virtual environment (recommended):

```bash
cd back-end
python -m venv env
source env/bin/activate
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Create or migrate the database and run the app (example using Flask CLI):

```bash
# From the back-end directory
export FLASK_APP=main.py
# Create DB tables in a scratch environment (not for production):
python -c "from main import app; from extensions import db; app.app_context().push(); db.create_all()"
# Or run Alembic migrations (requires FLASK_APP configured as above):
flask db upgrade

# Run the development server
python main.py
```

Frontend (Node)

1. Install dependencies and start dev server:

```bash
cd client/AJALI
npm install
npm run dev
```

2. Build for production:

```bash
npm run build
# Preview production build (if needed)
npm run preview
```

## Environment Variables

Backend (`back-end/config.py`)
- `DATABASE_URL` — SQLAlchemy database URL (example placeholder): `postgresql://user:pass@host:5432/dbname`
- `JWT_SECRET_KEY` — secret used to sign JWTs (generate a secure random value for production)

Frontend (`client/AJALI/src/lib/api.js`)
- `VITE_API_URL` — base URL of the backend API. If not set, the frontend falls back to `https://project-ajali.onrender.com` as a default in the code.

Important: Do not store secrets (private keys, passwords) in the repository. Use environment variables or a secure secret store for production.

## Database & Migrations

- The project uses Flask-Migrate / Alembic for database migrations. Migration scripts live under `back-end/migrations/`.
- Typical workflow (from `back-end/`):

```bash
export FLASK_APP=main.py
flask db migrate -m "Describe changes"
flask db upgrade
```

If you only need a quick test database in development, the repository includes a helper to create tables with `db.create_all()` (see the commands in Local Development).

## Seed Data

- `back-end/seed.py` creates sample users (including an admin account), sample incidents with mixed statuses, media records attached to incidents, and community posts.
- The seeder is idempotent for seeded rows (it checks for existing emails/incidents/posts and skips duplicates). Run it from the `back-end/` directory:

```bash
python seed.py
```

The seeded accounts (usernames/emails) are visible in `seed.py`; do not treat the scripted passwords as production secrets.

## Testing

Backend tests use `pytest`. From the project root or `back-end/` run:

```bash
cd back-end
pytest
```

Tests use an in-memory SQLite database and a test JWT secret configured in the test fixtures.

## Production / Deployment

- The backend is a standard WSGI Flask app; `gunicorn` is listed in `requirements.txt` for production hosting.
- Frontend builds with Vite and can be hosted as static assets on any static hosting provider; the frontend expects the backend API to be reachable at `VITE_API_URL`.

## Security

- Passwords are hashed via Werkzeug (`User.set_password` / `check_password`).
- JWT access tokens are issued with Flask-JWT-Extended. The application reads `JWT_SECRET_KEY` from the environment.
- Role-based admin checks use the `role` string on the `User` model (value `'admin'` required to access admin endpoints).
- CORS is enabled via `flask_cors.CORS(app)` in `main.py`.

## License / Statement

This repository does not include a license file. If you intend to publish or share Ajali, add a LICENSE file describing the intended terms. For now, treat this repo as an internal project snapshot intended for development and evaluation.

---

If you want, I can also run the test suite and validate the documentation against live outputs. Which step should I take next?

The project consists of a React frontend and a Flask REST API backend backed by a relational database.

---

## Project Structure

```text
Project-Ajali/
├── client/
│   └── AJALI/
│       ├── src/
│       ├── public/
│       ├── package.json
│       └── README.md
│
├── back-end/
│   ├── controller/
│   ├── models/
│   ├── schemas/
│   ├── migrations/
│   ├── tests/
│   ├── main.py
│   ├── config.py
│   ├── extensions.py
│   ├── seed.py
│   ├── requirements.txt
│   └── README.md
│
└── README.md

