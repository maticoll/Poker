import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, buyIns, transfers } from "@/db/schema";
import { eq, and, sum } from "drizzle-orm";
import { computeSettlement } from "@/lib/poker";

type Params = { params: Promise<{ id: string }> };

// POST /api/sessions/:id/close
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.status, "open")))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "not found or not open" }, { status: 404 });
  }

  const sPlayers = await db
    .select()
    .from(sessionPlayers)
    .where(eq(sessionPlayers.sessionId, id));

  // Check all players have final chips
  const missingChips = sPlayers.filter(
    (sp) => sp.finalChips === null || sp.finalChips === undefined
  );
  if (missingChips.length > 0) {
    return NextResponse.json(
      { error: "Faltan fichas finales de algunos jugadores" },
      { status: 422 }
    );
  }

  const bis = await db
    .select()
    .from(buyIns)
    .where(eq(buyIns.sessionId, id));

  const totalIn = bis.reduce((a, b) => a + b.amount, 0);
  const totalChips = sPlayers.reduce((a, sp) => a + (sp.finalChips ?? 0), 0);
  const diff = totalChips - totalIn;

  if (diff !== 0) {
    return NextResponse.json({ diff }, { status: 422 });
  }

  // Calculate nets and settlement
  const nets = sPlayers.map((sp) => {
    const playerIn = bis
      .filter((b) => b.playerId === sp.playerId)
      .reduce((a, b) => a + b.amount, 0);
    return {
      playerId: sp.playerId,
      net: (sp.finalChips ?? 0) - playerIn,
    };
  });

  const settlement = computeSettlement(nets);

  // Save transfers and close session
  if (settlement.length > 0) {
    await db.insert(transfers).values(
      settlement.map((s) => ({
        sessionId: id,
        fromPlayerId: s.from,
        toPlayerId: s.to,
        amount: s.amount,
      }))
    );
  }

  await db
    .update(sessions)
    .set({ status: "closed", closedAt: new Date() })
    .where(eq(sessions.id, id));

  return NextResponse.json({ ok: true });
}
