export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { db } from "@/db";
import { buyIns, sessions } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

// POST /api/buyins — add a rebuy
export async function POST(req: Request) {
  const body = await req.json();
  const { sessionId, playerId, amount, addedBy } = body;

  if (!sessionId || !playerId || !amount) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.status, "open")))
    .limit(1);

  if (!session) {
    return NextResponse.json({ error: "session not found or not open" }, { status: 404 });
  }

  const [row] = await db
    .insert(buyIns)
    .values({ sessionId, playerId, amount: Number(amount), addedBy: addedBy ?? null })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
