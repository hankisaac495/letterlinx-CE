# LetterLinx Classroom Edition — Build Plan

A prototype with no backend: state lives in memory and `localStorage` (Zustand),
with every external dependency behind an interface so real services can be swapped in.

## Architecture

```
src/
  app/                 Next.js App Router routes (teacher, student, projector, auth mock)
  components/          Shared UI (board, tiles, word list, leaderboard, …)
  lib/
    game/              Pure logic: word validation, seeded RNG, board generator,
                       path matching, scoring, hints. No React, fully unit-tested.
    sync/              SyncProvider interface + BroadcastChannel (Phase 5) and
                       Supabase Realtime (Phase 9) implementations.
    roster/            RosterProvider interface + MockCleverProvider + seed data (Phase 6).
    audio/             Web Audio synthesised sound effects (Phase 8).
    i18n/              English / Spanish UI strings (Phase 8).
  store/               Zustand stores (word sets, session, rounds, reports).
e2e/                   Playwright flows.
```

Key seams:

- **`SyncProvider`** (`joinRoom`, `broadcast`, `subscribe`, `leaveRoom`) — the only
  thing live-round code talks to. Chosen by a small factory based on env config.
- **`RosterProvider`** (`getTeacher`, `getSections`, `getStudents`) — Clever-shaped
  objects (`district`, `school`, `teacher`, `section`, `student`).
- **Board generator** is a pure function of `(words, seed)`; the seed is stored with each
  round so boards can be regenerated for reports and replays.

## Phases

| #   | Phase                             | Deliverable                                                                                                            |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | Project setup                     | Next.js + TS strict + Tailwind, Vitest, Playwright, ESLint, Prettier, folder structure, placeholder home page, README. |
| 2   | Word validation & board generator | Pure functions + thorough tests (≥ 50 random sets, Spanish Ñ/accents, seeds, filler rules, graceful failure).          |
| 3   | Student gameplay (single player)  | Drag-to-select board, any-path matching, scoring, timer, all display modes, clue mode, hints.                          |
| 4   | Teacher dashboard & word sets     | Create/edit with live validation, display radios, hint settings, clues, board preview + Shuffle, localStorage.         |
| 5   | Live rounds & projector           | BroadcastChannel SyncProvider, room codes, join, lobby, live view, toggles, team mode, reveal, Simulate class.         |
| 6   | Simulated Clever rostering        | Mock Clever/Google flows, seeded district, RosterProvider, Sync roster, both student sign-ins.                         |
| 7   | Reports                           | Per-round, per-word, per-section reports and CSV export.                                                               |
| 8   | Sound, animation, a11y, polish    | Web Audio effects, Framer Motion, colour-blind-safe highlights, reduced motion, Spanish UI, e2e flows.                 |
| 9   | Cross-device real-time (optional) | Supabase Realtime SyncProvider, env vars, setup docs; BroadcastChannel kept as fallback.                               |

At the end of each phase: `npm run check`, `npm run build`, commit, summarise, and wait
for go-ahead.
