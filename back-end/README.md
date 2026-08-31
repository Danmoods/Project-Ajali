# Ajali! Backend

This directory contains the Flask REST API for Ajali. The API implements authentication (JWT), user profiles, incident reporting + evidence management, a community feed, and administrator incident review endpoints.

## Overview

The API is implemented using Flask + Flask-RESTful and uses SQLAlchemy for persistence. Marshmallow is used for input/output schemas where appropriate and Flask-Migrate/Alembic is used to track schema changes.

## Technology Stack

- Python 3
- Flask, Flask-RESTful
- Flask-JWT-Extended (JWT-based auth)
- Flask-SQLAlchemy, Flask-Migrate (Alembic)
- Marshmallow (validation/serialization)
- PostgreSQL (production), SQLite (tests)

See `requirements.txt` for full dependency versions.

## Project Structure

- `main.py` — application factory and dev entrypoint
- `config.py` — configuration (reads `DATABASE_URL`, `JWT_SECRET_KEY`)
- `extensions.py` — instantiated Flask extensions (`db`, `migrate`, `jwt`, `ma`)
- `controller/` — API resources and route registration
- `models/` — SQLAlchemy models: `User`, `Incident`, `Media`, `CommunityPost`
- `schemas/` — Marshmallow schemas
- `migrations/` — Alembic migration scripts
- `seed.py` — idempotent seeder for sample data
- `tests/` — pytest suite covering auth, incidents, media, community and admin flows

## Installation

From the `back-end/` directory:

```bash
python -m venv env
source env/bin/activate
pip install -r requirements.txt
```

## Environment Variables

- `DATABASE_URL` — SQLAlchemy connection string (example): `postgresql://user:pass@host:5432/dbname`. Defaults to `postgresql://postgres:postgres@localhost:5432/ajali` if unset.
- `JWT_SECRET_KEY` — secret used to sign JWTs. Defaults to a placeholder in `config.py`; set a secure value in production.

Do not commit secrets or private credentials to the repository.

## Running the Backend

Development server (simple option):

```bash
cd back-end
python main.py
```

Alternatively, use the Flask CLI (recommended for migrations):

```bash
cd back-end
export FLASK_APP=main.py
flask run
```

For production use, serve the app with a WSGI server such as `gunicorn` (listed in `requirements.txt`).

## Database & Migrations

Migrations are managed with Alembic via Flask-Migrate. Typical workflow from `back-end/`:

```bash
export FLASK_APP=main.py
flask db migrate -m "Add description"
flask db upgrade
```

If you need a quick empty database in development or tests, you can create tables with SQLAlchemy directly:

```bash
python -c "from main import app; from extensions import db; app.app_context().push(); db.create_all()"
```

## Seeding

- `seed.py` inserts sample users (including an admin account), sample incidents with mixed statuses, media entries attached to incidents, and community posts.
- The seeder is idempotent with basic checks to avoid duplicates. Run from `back-end/`:

```bash
python seed.py
```

## Authentication & Security

- Passwords are hashed via Werkzeug helpers (`User.set_password` / `check_password`).
- JWT tokens are issued with Flask-JWT-Extended and signed with `JWT_SECRET_KEY`.
- Role-based admin checks are implemented by inspecting the `role` field on the `User` model (value `admin`).
- CORS is enabled in `main.py` via `flask_cors.CORS(app)`.

## API Endpoints

All endpoints are registered in `back-end/controller/__init__.py`. The routes implemented in the codebase are listed below. Authentication notes indicate whether a valid JWT is required and whether admin privileges are required.

Authentication

- `POST /auth/register` — register a new user (no auth required)
- `POST /auth/login` — login with email + password (no auth required)
- `GET /auth/me` — get current user's profile (requires JWT)
- `PATCH /auth/me` — update current user's profile fields (`username`, `email`, `phone`, `bio`, `profile_photo`) (requires JWT)
- `PUT /auth/change-password` — change password (requires JWT)

Administration

- `GET /admin/dashboard` — admin dashboard summary and recent incidents (requires JWT + admin role)
- `GET /admin/incidents` — list incidents for review (requires JWT + admin role)
- `GET|PATCH /admin/incidents/<int:incident_id>` — view an incident in full (GET) and update its `status` (PATCH) (requires JWT + admin role)

Incidents (citizen-facing)

- `GET /incidents` — list incidents with filters (requires JWT). Supports `status`, `incident_type`, `mine`, `q` (search), pagination (`page`, `per_page`).
- `POST /incidents` — submit a new incident (requires JWT)
- `GET /incidents/<int:incident_id>` — view a single incident (requires JWT)
- `PATCH|PUT /incidents/<int:incident_id>` — update an incident (owners only, and only while status is not reviewed) (requires JWT)
- `DELETE /incidents/<int:incident_id>` — delete an incident (owners only, and only while status is not reviewed) (requires JWT)

Incident Evidence / Media

- `GET /incidents/<int:incident_id>/media` — list media attached to an incident (requires JWT)
- `POST /incidents/<int:incident_id>/media` — attach media records to an incident (requires JWT; owners only; payload accepts single item or `media` list)
- `DELETE /incidents/<int:incident_id>/media/<int:media_id>` — remove a single media record (requires JWT; owners only)

Community

- `GET /community/posts` — list community posts (requires JWT; supports `q` and pagination)
- `POST /community/posts` — create a new post (requires JWT)
- `GET /community/posts/<int:post_id>` — view a single post (requires JWT)
- `PATCH|PUT /community/posts/<int:post_id>` — update a post (author only) (requires JWT)
- `DELETE /community/posts/<int:post_id>` — delete a post (author or admin) (requires JWT)

### Notes on endpoint behaviour

- Many endpoints return paginated lists with `items` and `pagination` metadata.
- Incident edits are blocked once an administrator has moved a report into a reviewed status (`verified`, `resolved`, `rejected`). Only admins can change `status` via the admin endpoints.
- The API generally returns JSON payloads with `message` fields for user-facing feedback and appropriate HTTP status codes.

## Testing

- Backend tests use `pytest`. From `back-end/` run:

```bash
pytest
```

The tests create an in-memory SQLite database and set a test `JWT_SECRET_KEY` via test fixtures.

## Deployment

- The backend is a WSGI app and can be served via `gunicorn` (included in `requirements.txt`). Configure environment variables (`DATABASE_URL`, `JWT_SECRET_KEY`) and run behind a process manager or platform of your choice.

## What I could not fully verify from code

- Any external CI/CD, container, or cloud deployment configuration (no Dockerfiles, CI config, or deployment manifests were present in the repository root to inspect).
- Any runtime Cloudinary server-side signing flows — the repository shows client-side Cloudinary uploads for profile photos, but no server-side Cloudinary configuration or secret is stored in the backend code.

If you'd like, I can run the backend tests now or add example `docker-compose` + env templates to simplify running the full stack locally.

