import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Params = { params: Promise<{ id: string; playerId: string }> };

// PATCH /api/sessions/:id/players/:playerId/chips
export async function PATCH(req: Request, { params }: Params) {
  const { id, playerId } = await params;
  const { finalChips } = await req.json();

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db
    .update(sessionPlayers)
    .set({ finalChips: finalChips === null ? null : Number(finalChips) })
    .where(
      and(
        eq(sessionPlayers.sessionId, id),
        eq(sessionPlayers.playerId, playerId)
      )
    );

  return NextResponse.json({ ok: true });
}
