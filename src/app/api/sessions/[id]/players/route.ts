import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, buyIns } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string }> };

// POST /api/sessions/:id/players — add player mid-game
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const { playerId } = await req.json();

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.status, "open")))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "not found or not open" }, { status: 404 });
  }

  // Check not already in session
  const [existing] = await db
    .select()
    .from(sessionPlayers)
    .where(
      and(
        eq(sessionPlayers.sessionId, id),
        eq(sessionPlayers.playerId, playerId)
      )
    )
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "already in session" }, { status: 409 });
  }

  await db.insert(sessionPlayers).values({
    sessionId: id,
    playerId,
    finalChips: null,
  });

  await db.insert(buyIns).values({
    sessionId: id,
    playerId,
    amount: session.defaultBuyIn,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
