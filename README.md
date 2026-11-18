# LetterLinx Classroom Edition

A classroom version of [LetterLinx](https://letterlinx.com): a teacher enters a vocabulary
list, the app hides those words on a static 6 × 9 letter board, and students race to find them
by dragging across neighbouring tiles. The teacher runs the round live on a projector.

> **Prototype.** Rostering (Clever / Google Classroom) is simulated and all names are
> fictional demo data. There is no backend yet — state lives in memory and `localStorage`.

See [`docs/PLAN.md`](docs/PLAN.md) for the architecture and build phases.

## Requirements

- Node.js 20.9+ (22 recommended)
- npm 10+

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Try a live round (one computer)

1. On the home page click **Log in with Clever** (or Google Classroom). Both are simulated:
   press **Allow** and pick one of the three demo teachers.
2. On the dashboard, click **Launch round** on a class (or **Launch** on a word set), then **Open projector**.
3. On the projector, click **Open a student tab**. Students enter the room code and tap their name
   from the class list, or use **Log in with Clever badge** (simulated) to land in their class's round.
   Each browser tab is one student.
4. Click **Simulate class** to fill the room with students from the roster, then **Start round**.

Until Phase 9, live rounds sync between tabs of the **same browser** (BroadcastChannel, with a
localStorage fallback). The projector tab runs the round, so keep it open.

### Sound, language and accessibility

- Sound effects are synthesised with the Web Audio API (`src/lib/audio`), so there are no audio files.
  Students start muted and the projector starts with sound on; every game view has a mute toggle and the
  projector has a volume slider.
- The interface is available in **English and Spanish** (switch in the banner or the projector bar).
  All strings live in `src/lib/i18n/messages.ts` with both languages side by side.
- Animations respect `prefers-reduced-motion`; found words use a colour-blind-safe palette plus numbered
  badges; projector letters are at least 6% of screen height.

### Sign-in options

- **Clever**, **Google Classroom** and **ClassLink** (all simulated): consent screen, then a demo teacher.
  ClassLink's demo data is stored in OneRoster 1.1 shape (`orgs`, `users`, `classes`, `enrollments`) and
  converted by adapters in `src/lib/roster/mockClassLink.ts`, ready to point at a real Roster Server.
- Students can join with a room code and their name, a **Clever badge** or a **ClassLink QuickCard** (simulated).
- **Email accounts** for schools without a rostering system: teachers create an account, then add classes and
  paste student names (first name + last initial only). Prototype: accounts and classes are saved in the
  teacher's browser, with passwords stored only as salted PBKDF2 hashes. `AccountService` and
  `ManualRosterProvider` are the seams for moving this to a hosted service (e.g. Supabase Auth + database).
- A round carries its class list with it, so student devices never need roster access.

### Rostering

All roster access goes through `RosterProvider` (`src/lib/roster`). `MockCleverProvider` serves a seeded,
fictional district (1 school, 3 teachers, 2–4 classes each, 15–28 students per class) shaped like
Clever's `district`, `school`, `teacher`, `section` and `student` objects. Students are stored as first
name + last initial only — no emails or passwords. Swap in a real Clever or Google Classroom client by
implementing the same interface and returning it from `getRosterProvider()`.

## Scripts

| Command                           | What it does                                                                 |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`                     | Start the dev server                                                         |
| `npm run build`                   | Production build                                                             |
| `npm start`                       | Serve the production build                                                   |
| `npm test`                        | Unit tests (Vitest)                                                          |
| `npm run test:watch`              | Unit tests in watch mode                                                     |
| `npm run test:e2e`                | End-to-end tests (Playwright; builds must exist — run `npm run build` first) |
| `npm run typecheck`               | TypeScript type check                                                        |
| `npm run lint`                    | ESLint                                                                       |
| `npm run format` / `format:check` | Prettier                                                                     |
| `npm run check`                   | Typecheck + lint + format check + unit tests                                 |

First-time Playwright setup on a new machine: `npx playwright install chromium`.

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project**, import the repository. The Next.js preset is detected
   automatically; no build settings need changing.
3. Set the production branch to `main`. Every push to `main` deploys to production and every
   pull request gets a preview URL.

## Teacher accounts and cloud storage (Supabase)

When Supabase is configured, **email accounts use Supabase Auth** (email confirmation, password reset)
and each teacher's **classes, word sets and reports are saved to their account** (tables in
`supabase/schema.sql`, protected by row-level security so teachers only see their own rows). The browser
keeps a per-account copy and saves changes as they happen; signing in on another computer brings everything
back. Clever / Google Classroom / ClassLink demo sign-ins stay local. Without Supabase, email accounts fall
back to this-browser-only accounts.

One-time Supabase setup:

1. **SQL Editor → New query**: paste `supabase/schema.sql`, click **Run**.
2. **Authentication → Sign In / Providers → Email**: enabled, with **Confirm email** on.
3. **Authentication → URL Configuration**: Site URL `https://www.letterlinxce.com`; Redirect URLs
   `https://www.letterlinxce.com/**`, `https://letterlinxce.com/**`, `http://localhost:3000/**`
   (add your Vercel preview pattern too, e.g. `https://*-<team>.vercel.app/**`).
4. Supabase's built-in mailer is for testing (it only emails the project team, a few per hour). Before
   inviting teachers, set a custom SMTP sender (e.g. Resend) under **Authentication → Emails → SMTP Settings**.

Tests: `npm run test:e2e:cloud` builds with placeholder Supabase settings and runs the account flows against an
in-browser fake of Supabase Auth and REST (no real project needed).

## Cross-device live rounds (Supabase Realtime)

Without configuration, live rounds sync between tabs of the **same browser** (BroadcastChannel).
To let students join from their own devices, connect a free Supabase project:

1. Sign up at [supabase.com](https://supabase.com) and create a project (any region close to your school;
   save the database password — the app doesn't use it).
2. In the project, open **Project Settings → API Keys** and copy:
   - the **Project URL** (`https://<ref>.supabase.co`)
   - the **publishable** key (`sb_publishable_…`, called the _anon / public_ key in older projects).
     Never use the `service_role` / secret key.
3. In **Vercel → Project → Settings → Environment Variables**, add for Production, Preview and Development:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = publishable key
4. Redeploy (environment variables apply to new deployments only).
5. In Supabase **Realtime → Settings**, make sure public channels are allowed (leave
   "private channels only" off). No tables or database setup are needed: the app uses Realtime
   _broadcast_ only.

For local development, copy `.env.example` to `.env.local` and fill in the same two values.

The projector lobby shows **Live across devices** when Realtime is connected, or **This browser only
(demo mode)** otherwise. If Realtime can't connect, the app falls back to same-browser sync automatically.

How traffic is kept low (the free plan meters messages): the projector broadcasts room snapshots about once
a second on `llce:<code>`; students send their progress to a projector-only inbox topic
(`llce:<code>:inbox`) over REST, so students never receive each other's updates.

What stays local: word sets, reports and the roster session live in the teacher's browser; scores are
reported by each student's device and are not server-verified (fine for a prototype, not for grading).
