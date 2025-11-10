# Campus SOS

A complete guide to installing, running, and understanding **Campus SOS** (web + backend + ML/validator).

This README covers:

1.  Prerequisites
2.  Environment Variables (Examples)
3.  Install & Run (Per Component)
4.  Endpoints & Sample Requests
5.  User Workflow (Student)
6.  Admin Workflow
7.  How Campus SOS Streamlines Work
8.  Troubleshooting & FAQ
9.  Security & Production Notes
10. Future Roadmap

---

## 1. Prerequisites

-   Node.js (>= 18 recommended) + npm or yarn
-   Python 3.10+ (for ML/validator)
-   MongoDB (local or Atlas)
-   Cloudinary account (or alternative image store) --- for image uploads
-   Firebase (for authentication) --- optional for Google sign-in
-   (Optional) Docker & Docker Compose
-   (Optional but recommended) An LLM provider account (OpenAI, Google Gemini, etc.) and API key for the ML validator

---

## 2. Environment Variables (Examples)

Create `.env` files for each component.

### Backend --- `.env` (Node/Express)

```

PORT=5000

MONGO_URI=mongodb://localhost:27017/campus_sos

JWT_SECRET=replace_with_a_secure_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name

CLOUDINARY_API_KEY=your_key

CLOUDINARY_API_SECRET=your_secret

VALIDATOR_URL=http://localhost:9000/validate

FRONTEND_URL=http://localhost:3000

```

### Frontend --- `.env` (Vite)

```

VITE_API_URL=http://localhost:5000

VITE_VALIDATOR_URL=http://localhost:9000/validate

Optional
========

VITE_FIREBASE_API_KEY=...

VITE_FIREBASE_AUTH_DOMAIN=...

VITE_FIREBASE_PROJECT_ID=...

VITE_MAPS_API_KEY=...

```

### ML / Validator --- `.env` (Python)

```

PORT=9000

LLM_PROVIDER=openai|gemini

OPENAI_API_KEY=sk-...

GOOGLE_API_KEY=...

ALLOWED_ORIGINS=http://localhost:3000

```

---

## 3. Install & Run (Per Component)

> All commands assume you are in the relevant subfolder (e.g., `frontend/`, `backend/`, `validator/`).

### 3.1. Frontend (React + Vite + Tailwind + Leaflet)

**Install**

```bash
cd frontend
npm install
# or
yarn

```

**Dev Run**

Bash

```
# start Vite dev server
npm run dev
# or
yarn dev

```

**Build (Production)**

Bash

```
npm run build
# output in dist/, serve with static server

```

**Notes**

-   Ensure `VITE_API_URL` points to your backend.

-   Add `import 'leaflet/dist/leaflet.css'` in `src/main.tsx` once.

-   Map tiles use OpenStreetMap by default.

### 3.2. Backend (Node.js + Express + Mongoose)

**Install**

Bash

```
cd backend
npm install
# or
yarn

```

**Dev Run**

Bash

```
# if using nodemon
npm run dev
# or (after building with tsc)
node dist/index.js

```

**Key Scripts (example `package.json`)**

JSON

```
{
  "scripts": {
    "dev": "nodemon src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  }
}

```

**API Server**

-   Default: `http://localhost:5000`

-   Main routes (summary):

    -   `GET /api/issues` --- list issues (supports filters/pagination)

    -   `POST /api/issues` --- create new issue (auth required). Body: `{ title, description, lng, lat, tags[], severity, imageUrl }`

    -   `GET /api/issues/:id` --- single issue

    -   `PATCH /api/issues/:id/status` --- update status (admin/reporters)

    -   `POST /api/issues/:id/upvote` --- toggle upvote

    -   `POST /api/upload/image` --- upload image (multipart/form-data field `image`) → returns `{ url }`

    -   `GET /api/issues/me` --- list user's issues

**Env**

-   `MONGO_URI`, `JWT_SECRET`, `CLOUDINARY_*` must be set.

### 3.3. ML / Validator (Python service)

**Install**

Bash

```
cd validator
python -m venv .venv
source .venv/bin/activate  # windows: .venv\Scripts\activate
pip install -r requirements.txt

```

**Run**

Bash

```
# If using Flask
export FLASK_APP=app.py
export FLASK_ENV=development
python app.py

# If using FastAPI
uvicorn app:app --reload --port 9000

```

**What it does**

-   Receives `{ description, imageUrl }`

-   Calls an LLM + heuristics to determine whether the report is allowed and suggests tags.

-   Returns JSON:

    JSON

    ```
    {
      "allowed": true,
      "suggestedTags": ["Plumbing", "Maintenance"],
      "raw_llm": { ... }
    }

    ```

**Notes**

-   Provide your LLM API key in `.env` for the validator.

* * * * *

4\. Example Requests & Quick Checks
-----------------------------------

**Create Issue (from frontend)**

Bash

```
curl -X POST http://localhost:5000/api/issues\
 -H "Content-Type: application/json"\
 -H "Authorization: Bearer <token>"\
 -d '{
   "title":"Broken faucet - Library",
   "description":"Water leaking for last 2 days",
   "lng":81.8496,
   "lat":25.4358,
   "tags":["Plumbing","Sanitation"],
   "severity":"Medium",
   "imageUrl":"[https://res.cloudinary.com/.../image.jpg](https://res.cloudinary.com/.../image.jpg)"
 }'

```

**Upload Image**

Bash

```
curl -X POST http://localhost:5000/api/upload/image\
 -H "Authorization: Bearer <token>"\
 -F "image=@/path/to/photo.jpg"
# receives { "url": "[https://res.cloudinary.com/](https://res.cloudinary.com/)..." }

```

**Validator**

Bash

```
curl -X POST http://localhost:9000/validate\
 -H "Content-Type: application/json"\
 -d '{"description":"broken steps", "imageUrl":"https.../..." }'

```

* * * * *

5\. User (Student) Workflow
---------------------------

1.  **Login**

    -   Use Firebase Google sign-in (or backend auth). Frontend stores JWT in `localStorage`.

2.  **Report an Issue**

    -   Click "Report Issue".

    -   Fill Title, Description, Location (auto-fill or manual).

    -   Attach a photo (optional) or paste an image URL.

    -   Click **Validate**: This uploads the image (if file) and calls the ML validator with `{description, imageUrl}`.

        -   Validator returns `allowed: true/false` and `suggestedTags`.

        -   If blocked, the UI will show the reason.

    -   If allowed, choose tags and severity, then **Submit**.

    -   Issue is created and visible on the campus map.

3.  **Interact**

    -   View all issues on the map and list. Upvote issues to prioritize.

    -   View details, comments, and follow status updates.

* * * * *

6\. Admin Workflow
------------------

1.  **Login as Admin**

    -   Admin users have `role: admin`. JWT must reflect this role.

2.  **Overview Dashboard**

    -   Stats cards show totals (Open, In Progress, Resolved).

    -   Heatmap and Pins display density and precise locations.

3.  **Filtering & Triage**

    -   Filter by category or tag.

    -   Click markers or table rows to inspect a report.

4.  **Update Status**

    -   Admins can change status (Open, InProgress, Resolved).

    -   When an issue is resolved: `resolvedAt` is set and the reporter gets points.

5.  **Assign / Moderate**

    -   Assign admins or change tags to keep data clean.

* * * * *

7\. How Campus SOS Streamlines Work
-----------------------------------

-   **Fast Reporting:** Simple, mobile-friendly UI for students to report problems with photos and exact geo-coordinates.

-   **AI-Assisted Triage:** Validator (LLM) checks for spam, inappropriate content and suggests tags, reducing manual moderation.

-   **Spatial Prioritization:** Map + heatmap shows clusters and hotspots so admins can dispatch maintenance resources efficiently.

-   **Engagement & Incentives:** Reporters earn points on resolved issues, encouraging responsible reporting.

-   **Audit Trail:** Status changes, timestamps, and images create an auditable record.

-   **One-Stop Dashboard:** Admins can filter, view, update, and export issues; students see progress.

* * * * *

8\. Troubleshooting & FAQ
-------------------------

**Q: Validator returns "quota exceeded" or provider errors**

-   Check your provider account (OpenAI/GEMINI) for usage limits.

-   Add fallback heuristics (simple keyword checks) in validator if LLM fails.

**Q: Map markers not showing**

-   Ensure issues have valid `lat` and `lng` numeric fields.

-   Ensure Leaflet CSS is imported once (missing CSS breaks icons).

**Q: 403 Forbidden on status update**

-   Verify JWT token is present & valid.

-   Check `req.user.role` on backend; ensure admin user has `role: 'admin'`.

**Q: Image upload failing**

-   Check Cloudinary credentials and `CLOUDINARY_*` env vars.

-   Inspect backend logs for Cloudinary SDK errors.

* * * * *

9\. Security & Production Notes
-------------------------------

-   Use HTTPS in production.

-   Store secrets (JWT_SECRET, Cloudinary keys, LLM keys) in environment variables or a secrets manager. Never commit them to the repo.

-   Rate-limit validator & upload endpoints to avoid abuse.

-   Validate user-supplied lat/lng values server-side.

-   Use CORS properly.

* * * * *

10\. Future Roadmap
-------------------

-   Add marker clustering (e.g., `Leaflet.markercluster`) for dense maps.

-   Add role-based admin pages (assignments, SLA tracking).

-   Add real-time updates via WebSockets for instant UI refresh.

-   Add export (CSV) & scheduled reports for facilities teams.

-   Add unit tests and E2E tests for key flows.
