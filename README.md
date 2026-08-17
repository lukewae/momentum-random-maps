# Momentum Mod Map Roulette & Speedrun Hub

A fast, minimalist web app for the **Momentum Mod** speedrunning community.
**Live Website:** [https://momentum-random-maps.vercel.app](https://momentum-random-maps.vercel.app)

---

## Features

- **Random Map Roulette** — Instant map picker with slot cycling, keyboard shortcuts (<kbd>SPACE</kbd> / <kbd>R</kbd>), and one-click map name copy.
- **In-Game Bonus Tracks Support** — Full support for 540+ bonus tracks with individual tiers and interactive track selectors.
- **Ranked vs. Unranked Filtering** — Toggle between All, Ranked, or Unranked maps.
- **Accurate Gamemode Separation** — Dedicated filters for Surf, Bhop, 1.6 KZ, KZT, Rocket Jump, Sticky Jump, Conc, Defrag, Ahop, and Tricks.
- **Tier 1–10 Slider** — Dual-thumb range slider for granular difficulty selection.
- **Timed Speedrun Challenge** — 15m, 30m, 45m, and 60m challenges with live clock, scoring, run summaries, and leaderboard submission.
- **Full Database Explorer** — Browse and search all 1,118+ maps with instant search and sort options.
- **Pure Web Audio Synthesis** — Gentle, custom-synthesized sine-wave audio effects with zero audio asset latency.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Sync Maps from Momentum Mod API
```bash
npm run sync-maps
```

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## Tech Stack
- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Audio:** Web Audio API Pure Sine Synthesis
