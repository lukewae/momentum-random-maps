# Momentum Mod Map Roulette & Speedrun Hub

A fast, minimalist web app for the **Momentum Mod** speedrunning community.

Live Website: [https://momentum-random-maps.vercel.app](https://momentum-random-maps.vercel.app)

---

## Key Features

* **Map Roulette:** Instant map picker with slot-machine cycling, quick copy, and keybinds (`Space` / `R`).
* **Bonus Tracks:** Support for 540+ bonus tracks with independent tiers and selectors.
* **Rank Toggles:** Filter by All, Ranked, or Unranked.
* **Game Modes:** Full coverage for Surf, Bhop, 1.6 KZ, KZT, Rocket Jump, Sticky Jump, Conc, Defrag, Ahop, and Tricks.
* **Tier Slider:** Dual-thumb filter covering Tiers 1 through 10.
* **Speedrun Challenges:** 15m, 30m, 45m, and 60m timed runs with live tracking, summaries, and leaderboard submission.
* **Map Database:** Complete catalog of all 1,118+ maps with instant search and sorting.
* **Web Audio SFX:** Zero-latency sound effects synthesized in-browser via Web Audio API.
  
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
