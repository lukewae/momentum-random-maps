# Momentum Mod Random Map Picker

A fast, responsive, and minimalist web application for the Momentum Mod speedrunning community answering the question: **"What Momentum map should I play?"**

## Features

- **Random Map Picker**: Instant map selector with roulette rolling animations, keyboard shortcuts (`Space` / `R`), and console launch command copy (`map <mapname>`).
- **Multi-Mode Filter**: Filter random rolls and map lists across any combination of game modes (*Surf*, *Bhop*, *KZ*, *Rocket Jump*, *Sticky Jump*, *Ahop*, *Parkour*, *Conc*, *Defrag*).
- **Dual-Handle Tier Range Drag Slider**: Precision filtering from Tier 1 to Tier 10 with clickable tick marks.
- **Timed Challenge (Speedrun Rush Mode)**: Track how many maps you can beat in 15, 30, 45, or 60 minutes with a live countdown clock, score tracker, and copyable run summary.
- **100% Standalone & Offline**: Over 1,100+ Momentum Mod maps stored locally in `src/data/maps.json` with zero runtime scraping or database requirements.
- **Map Rescan CLI**: Built-in script to fetch and update maps directly from Momentum Mod's public API.

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
