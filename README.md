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

1. Open **/teacher**, click **Launch** on a word set, then **Open projector**.
2. On the projector, click **Open a student tab** (or open `/join` in another tab) and join with the room code.
   Each browser tab is one student.
3. Click **Simulate class** to add pretend students who find words at different speeds, then **Start round**.

Until Phase 9, live rounds sync between tabs of the **same browser** (BroadcastChannel, with a
localStorage fallback). The projector tab runs the round, so keep it open.

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
