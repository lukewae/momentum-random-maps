import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { LeaderboardEntry } from '@/types/leaderboard';

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'leaderboard.json');

let leaderboard: LeaderboardEntry[] = [];

function loadData(): LeaderboardEntry[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch {}
  return leaderboard;
}

function saveData(data: LeaderboardEntry[]) {
  leaderboard = data;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

export async function GET(request: NextRequest) {
  const duration = parseInt(request.nextUrl.searchParams.get('duration') || '30', 10);
  const data = loadData()
    .filter((e) => e.durationMinutes === duration)
    .sort((a, b) => b.mapsBeaten - a.mapsBeaten || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ entries: data.slice(0, 50) });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry: LeaderboardEntry = {
      id: `run-${Date.now()}`,
      runnerName: (body.runnerName || 'Anonymous').slice(0, 20),
      durationMinutes: body.durationMinutes || 30,
      mapsBeaten: body.maps?.length || 0,
      skippedCount: body.skippedCount || 0,
      createdAt: new Date().toISOString(),
      maps: body.maps || [],
    };

    const data = loadData();
    data.push(entry);
    saveData(data);

    const rank = data
      .filter((e) => e.durationMinutes === entry.durationMinutes)
      .sort((a, b) => b.mapsBeaten - a.mapsBeaten)
      .findIndex((e) => e.id === entry.id) + 1;

    return NextResponse.json({ success: true, rank });
  } catch {
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
