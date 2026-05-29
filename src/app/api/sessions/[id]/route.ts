import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, sessionPlayers, buyIns, transfers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { computeSettlement } from "@/lib/poker";

type Params = { params: Promise<{ id: string }> };

// DELETE /api/sessions/:id — cancel open session
export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, id), eq(sessions.status, "open")))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "not found or not open" }, { status: 404 });
  }

  await db.delete(sessions).where(eq(sessions.id, id));
  return NextResponse.json({ ok: true });
}
