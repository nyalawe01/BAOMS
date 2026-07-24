# BAOMS — Business/Administration & Operations Management System

A React + Vite single-page application for organization back-office management, backed by
Firebase (Auth + Firestore, with Storage rules for document uploads). It provides
role-specific dashboards and workflows for 12 staff roles:

System Administrator, Executive Director, HR Officer, Project Manager, Finance Officer,
Procurement & Logistics Officer, Department Head, Program Officer, Communications Officer,
Field Officer, Volunteer, Intern.

## Stack

- React 19 + Vite 8
- Tailwind CSS
- Firebase 10 (Auth, Firestore; `storage.rules` present for Firebase Storage)
- `lucide-react` icons, `sweetalert2` dialogs, `xlsx` for spreadsheet import/export

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Firebase project values (see below)
npm run dev
```

### Environment variables

Firebase config is read from environment variables, not hardcoded. Copy `.env.example` to
`.env.local` and fill in the values from the Firebase console (Project settings → General →
Your apps → SDK setup and configuration):

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

`.env.local` is gitignored and must never be committed. If `VITE_FIREBASE_PROJECT_ID` is
unset, the app falls back to a local-storage-simulated auth mode instead of talking to
Firebase (see `src/context/AuthContext.jsx`).

### Seeding demo data

`src/firebase/seed.js` creates the 12 demo role accounts (in Firebase Auth) and a few sample
projects (in Firestore). It's a Node script, separate from the Vite app:

```bash
npm run seed
```

This requires `.env.local` to be present, and requires `SEED_CONFIRM=yes` to be set (as a
safeguard against accidentally reseeding a live project) — e.g. `SEED_CONFIRM=yes npm run seed`.
Generated passwords are printed once to the console and are not stored anywhere; save them
immediately and have each account change its password on first login.

Seeding writes documents directly from the client SDK, which only succeeds if
`firestore.rules` currently allows it. On a brand-new project you'll need to temporarily
relax the rules, seed, then **immediately restore the real rules** — never leave permissive
rules deployed against a project holding real data.

### Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run oxlint |
| `npm run seed` | Seed demo users/projects into Firestore (see above) |

## Project structure

```
src/
├── App.jsx, main.jsx        # app entry
├── components/
│   ├── base/                # reusable UI primitives (buttons, inputs, avatar, etc.)
│   ├── application/         # composite components (e.g. file upload)
│   └── shared-assets/       # illustrations, etc.
├── context/
│   ├── AuthContext.jsx      # auth state, login/logout, permissions
│   └── ProjectContext.jsx   # project/audit-log state
├── firebase/
│   ├── firebase.js          # Firebase app/auth/db init (env-driven config)
│   ├── schema.js            # documented Firestore data model
│   └── seed.js              # demo data seeding script (see above)
└── views/                   # one file per role/area (AdminViews, HrOfficerViews, etc.)
```

`firestore.rules` and `storage.rules` define per-role, per-collection access control and
should be treated as the source of truth for what each role can read/write — keep them in
sync with any permission changes made in `AuthContext.jsx` or the view files.

## Status

Pre-launch. No automated tests yet (planned: Vitest + React Testing Library). Some of the
larger `views/*.jsx` files are being split into smaller components for maintainability.
