# Ajali! Frontend

This folder contains the Ajali single-page frontend built with React and Vite. It talks to the Ajali Flask REST API and implements the user-facing UI: authentication, profile management (including client-side Cloudinary uploads for profile pictures), incident reporting, incident list/map pages, community posts, and an admin interface for reviewing incidents.

## Overview

- Entry: `src/main.jsx` and `src/App.jsx` (Vite)
- API client: `src/lib/api.js` — central fetch wrapper that reads `VITE_API_URL` and attaches the auth token stored in `localStorage` under `ajali_token`.
- Auth: `src/context/AuthContext.jsx` — manages `user`, `token`, and exposes `register`, `login`, `logout`, and `updateProfile` functions used across pages.

## Features (implemented)

- Registration and login with JWT-backed API.
- Profile page with editable profile fields and client-side profile photo upload to Cloudinary (`src/pages/Profile.jsx`). After Cloudinary returns a `secure_url`, the frontend sends it to the API via `updateProfile`.
- Incident reporting: report submission, listing, detail view, filtering, and map page (`src/pages/ReportForm.jsx`, `src/pages/Reports.jsx`, `src/pages/IncidentDetail.jsx`, `src/pages/IncidentMap.jsx`).
- Community wall: browse and create posts (`src/pages/Community.jsx`).
- Admin UI: admin dashboard and admin incidents list pages under `src/pages/admin/` (`AdminDashboard.jsx`, `AdminIncidents.jsx`). Role checks are enforced by the backend; the frontend shows the admin pages and relies on API responses.

## Tech Stack

Dependencies (see `package.json`):
- `react`, `react-dom` (v19)
- `react-router-dom` — routing
- `lucide-react` — icons

Dev tools and frameworks:
- `vite`, `tailwindcss`, `postcss`, `eslint`

## Project Structure (important folders)

- `src/lib` — `api.js` central HTTP client
- `src/context` — `AuthContext.jsx`, `DataContext.jsx` for shared state
- `src/pages` — top-level page components (Login, Register, Profile, Reports, ReportForm, IncidentMap, IncidentDetail, Community, admin pages)
- `src/components` — UI components and layout components
- `src/components/ui` — UI primitives (Avatar, Badge, IncidentCard, CommunityPost, etc.)

## Installation

```bash
cd client/AJALI
npm install
```

## Development

Start the dev server:

```bash
npm run dev
```

Linting:

```bash
npm run lint
```

Production build / preview:

```bash
npm run build
npm run preview
```

## Environment Variables

- `VITE_API_URL` — base URL of the backend API used by `src/lib/api.js`. If not set, the frontend code falls back to `https://project-ajali.onrender.com`.

Export or set this variable in your environment before running the dev server or building the app.

## Authentication (how AuthContext works)

- `AuthContext` stores `user` and `token` and exposes `register`, `login`, `logout`, `updateProfile`.
- On app start `AuthProvider` attempts to restore a session by reading `ajali_token` from `localStorage` and calling `GET /auth/me`.
- `register` and `login` call the backend endpoints, save `access_token` in `localStorage` under `ajali_token`, and persist a `ajali_user` JSON blob.
- All API calls use `apiFetch` which attaches `Authorization: Bearer <token>` when `ajali_token` is present in `localStorage`.

## Profile Pictures / Cloudinary

- The profile page (`src/pages/Profile.jsx`) performs direct client-side uploads to Cloudinary using a hardcoded `upload_preset` (`ajali_profile_upload`) and cloud name (`askth98l`) in the code. After Cloudinary returns the uploaded asset `secure_url`, the frontend calls `PATCH /auth/me` to update the user's `profile_photo`.
- For production use replace the hardcoded Cloudinary parameters with secure configuration and consider a signed upload flow.

## API Communication

- `src/lib/api.js` exports `apiFetch(path, options)` which:
	- Resolves the base API URL from `import.meta.env.VITE_API_URL` (fallback in code present).
	- Attaches `Content-Type: application/json` for JSON bodies.
	- Reads `ajali_token` from `localStorage` and sets `Authorization: Bearer <token>` when present.
	- Throws an Error for non-2xx responses; otherwise returns parsed JSON.

## Admin Interface

- Admin pages are available under the `src/pages/admin/` folder: `AdminDashboard.jsx` and `AdminIncidents.jsx`.
- The frontend relies on the backend to enforce admin permissions; the backend uses the `role` string on the `User` model and requires `role == 'admin'` for admin endpoints.

## Notes

- The README documents only implementations found in the source. If you'd like, I can also update environment handling for Cloudinary (remove hardcoded values) or add developer scripts for running both frontend and backend concurrently.

