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

No environment variables are needed until Phase 9 (cross-device play via Supabase Realtime).
At that point, copy `.env.example` to `.env.local` for local work and add the same variables in
**Vercel → Project → Settings → Environment Variables**. Never commit real keys.
