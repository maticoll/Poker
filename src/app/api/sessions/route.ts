export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, buyIns, transfers, players } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/sessions — closed sessions with full data
export async function GET() {
  const closed = await db
    .select()
    .from(sessions)
    .where(eq(sessions.status, "closed"))
    .orderBy(desc(sessions.startedAt));

  const playerRows = await db.select().from(players);
  const playerMap = Object.fromEntries(playerRows.map((p) => [p.id, p]));

  const result = await Promise.all(
    closed.map(async (s) => {
      const sPlayers = await db
        .select()
        .from(sessionPlayers)
        .where(eq(sessionPlayers.sessionId, s.id));

      const bis = await db
        .select()
        .from(buyIns)
        .where(eq(buyIns.sessionId, s.id));

      const trans = await db
        .select()
        .from(transfers)
        .where(eq(transfers.sessionId, s.id));

      const rows = sPlayers.map((sp) => {
        const playerBuyIns = bis.filter((b) => b.playerId === sp.playerId);
        const totalIn = playerBuyIns.reduce((a, b) => a + b.amount, 0);
        const net =
          sp.finalChips === null || sp.finalChips === undefined
            ? 0
            : sp.finalChips - totalIn;
        return {
          playerId: sp.playerId,
          player: playerMap[sp.playerId] ?? null,
          totalIn,
          finalChips: sp.finalChips ?? null,
          net,
        };
      });

      const totalIn = rows.reduce((a, r) => a + r.totalIn, 0);

      return {
        ...s,
        rows,
        totalIn,
        transfers: trans.map((t) => ({
          ...t,
          from: playerMap[t.fromPlayerId] ?? null,
          to: playerMap[t.toPlayerId] ?? null,
        })),
      };
    })
  );

  return NextResponse.json(result);
}

// POST /api/sessions — create new session
export async function POST(req: Request) {
  const body = await req.json();
  const { playerIds, defaultBuyIn = 1000 } = body;

  if (!Array.isArray(playerIds) || playerIds.length < 2) {
    return NextResponse.json(
      { error: "Se necesitan al menos 2 jugadores" },
      { status: 400 }
    );
  }

  // Only one open session at a time
  const [existing] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.status, "open"))
    .limit(1);

  if (existing) {
    return NextResponse.json(
      { error: "Ya hay una partida en curso" },
      { status: 409 }
    );
  }

  const [session] = await db
    .insert(sessions)
    .values({ defaultBuyIn, status: "open" })
    .returning();

  // Add players
  await db.insert(sessionPlayers).values(
    playerIds.map((pid: string) => ({
      sessionId: session.id,
      playerId: pid,
      finalChips: null,
    }))
  );

  // Seed initial buy-ins
  await db.insert(buyIns).values(
    playerIds.map((pid: string) => ({
      sessionId: session.id,
      playerId: pid,
      amount: defaultBuyIn,
    }))
  );

  return NextResponse.json(session, { status: 201 });
}
