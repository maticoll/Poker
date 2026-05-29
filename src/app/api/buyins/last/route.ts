export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { db } from "@/db";
import { buyIns, sessions } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";

// DELETE /api/buyins/last — undo last rebuy (keep at least one)
export async function DELETE(req: Request) {
  const { sessionId, playerId } = await req.json();

  if (!sessionId || !playerId) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  // Count player's buy-ins
  const [{ total }] = await db
    .select({ total: count() })
    .from(buyIns)
    .where(and(eq(buyIns.sessionId, sessionId), eq(buyIns.playerId, playerId)));

  if (Number(total) <= 1) {
    return NextResponse.json(
      { error: "No se puede borrar el buy-in inicial" },
      { status: 409 }
    );
  }

  // Delete most recent
  const [latest] = await db
    .select({ id: buyIns.id })
    .from(buyIns)
    .where(and(eq(buyIns.sessionId, sessionId), eq(buyIns.playerId, playerId)))
    .orderBy(desc(buyIns.createdAt))
    .limit(1);

  if (latest) {
    await db.delete(buyIns).where(eq(buyIns.id, latest.id));
  }

  return NextResponse.json({ ok: true });
}
