export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, buyIns, transfers, players } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { computeSettlement } from "@/lib/poker";

// GET /api/sessions/current
export async function GET() {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.status, "open"))
    .limit(1);

  if (!session) return NextResponse.json(null);

  const sPlayers = await db
    .select()
    .from(sessionPlayers)
    .where(eq(sessionPlayers.sessionId, session.id));

  const bis = await db
    .select()
    .from(buyIns)
    .where(eq(buyIns.sessionId, session.id))
    .orderBy(buyIns.createdAt);

  const playerRows = await db.select().from(players);
  const playerMap = Object.fromEntries(playerRows.map((p) => [p.id, p]));

  const rows = sPlayers.map((sp) => {
    const playerBuyIns = bis
      .filter((b) => b.playerId === sp.playerId)
      .map((b) => ({ id: b.id, amount: b.amount, createdAt: b.createdAt }));
    const totalIn = playerBuyIns.reduce((a, b) => a + b.amount, 0);
    const net =
      sp.finalChips === null || sp.finalChips === undefined
        ? 0
        : sp.finalChips - totalIn;
    return {
      playerId: sp.playerId,
      player: playerMap[sp.playerId] ?? null,
      buyIns: playerBuyIns,
      totalIn,
      finalChips: sp.finalChips ?? null,
      net,
    };
  });

  const totalIn = rows.reduce((a, r) => a + r.totalIn, 0);

  return NextResponse.json({ ...session, rows, totalIn });
}
