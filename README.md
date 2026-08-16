# Momentum Mod Random Map Picker

A fast, minimalist web app for the Momentum Mod speedrunning community.

## Features

- **Random Map Picker** — Randomly selects maps with roulette animation, keyboard shortcuts, and copyable launch commands.
- **Game Mode Filters** — Filter maps by Surf, Bhop, KZ, Rocket Jump, Sticky Jump, Ahop, Parkour, Conc, or Defrag.
- **Tier Filter** — Filter maps from Tier 1–10 with a drag slider.
- **Speedrun Rush** — Timed challenges for 15, 30, 45, or 60 minutes with a timer, score, and run summary.
- **Offline** — 1,100+ maps stored locally with no database or runtime scraping.
- **Map Rescan CLI** — Update the map list using Momentum Mod’s public API.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Update Local Map Database
```bash
npm run sync-maps
```

### 4. Build for Production
```bash
npm run build
npm run start
```

## Tech Stack
- [Next.js](https://nextjs.org/) (App Router, Turbopack)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide React](https://lucide.dev/)
