import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, buyIns } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string; playerId: string }> };

// DELETE /api/sessions/:id/players/:playerId
export async function DELETE(_req: Request, { params }: Params) {
  const { id, playerId } = await params;

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.status, "open")))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "not found or not open" }, { status: 404 });
  }

  // Delete player's buy-ins for this session
  await db
    .delete(buyIns)
    .where(and(eq(buyIns.sessionId, id), eq(buyIns.playerId, playerId)));

  // Remove from session_players
  await db
    .delete(sessionPlayers)
    .where(
      and(
        eq(sessionPlayers.sessionId, id),
        eq(sessionPlayers.playerId, playerId)
      )
    );

  return NextResponse.json({ ok: true });
}
