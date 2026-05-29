export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, buyIns, players } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/ranking
export async function GET() {
  const closed = await db
    .select()
    .from(sessions)
    .where(eq(sessions.status, "closed"));

  const allPlayers = await db.select().from(players);

  if (!closed.length) return NextResponse.json([]);

  const map: Record<
    string,
    { id: string; total: number; games: number; best: number; worst: number }
  > = {};
  for (const p of allPlayers) {
    map[p.id] = { id: p.id, total: 0, games: 0, best: 0, worst: 0 };
  }

  for (const s of closed) {
    const sPlayers = await db
      .select()
      .from(sessionPlayers)
      .where(eq(sessionPlayers.sessionId, s.id));
    const bis = await db
      .select()
      .from(buyIns)
      .where(eq(buyIns.sessionId, s.id));

    for (const sp of sPlayers) {
      const m = map[sp.playerId];
      if (!m) continue;
      const playerIn = bis
        .filter((b) => b.playerId === sp.playerId)
        .reduce((a, b) => a + b.amount, 0);
      const n = (sp.finalChips ?? 0) - playerIn;
      m.total += n;
      m.games++;
      m.best = Math.max(m.best, n);
      m.worst = Math.min(m.worst, n);
    }
  }

  const result = Object.values(map)
    .filter((m) => m.games > 0)
    .sort((a, b) => b.total - a.total)
    .map((m) => ({
      ...m,
      player: allPlayers.find((p) => p.id === m.id) ?? null,
    }));

  return NextResponse.json(result);
}
