import { NextResponse } from "next/server";
import { db } from "@/db";
import { players, sessionPlayers, buyIns } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, bank, account } = body;

  const update: Partial<{ name: string; bank: string; account: string }> = {};
  if (name !== undefined) update.name = name.trim();
  if (bank !== undefined) update.bank = bank;
  if (account !== undefined) update.account = account;

  const [updated] = await db
    .update(players)
    .set(update)
    .where(eq(players.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Block if player has any sessions
  const [inSession] = await db
    .select({ count: eq(sessionPlayers.playerId, id) })
    .from(sessionPlayers)
    .where(eq(sessionPlayers.playerId, id))
    .limit(1);

  const [inBuyins] = await db
    .select({ count: eq(buyIns.playerId, id) })
    .from(buyIns)
    .where(eq(buyIns.playerId, id))
    .limit(1);

  if (inSession || inBuyins) {
    return NextResponse.json(
      { error: "No se puede borrar: el jugador tiene partidas registradas" },
      { status: 409 }
    );
  }

  await db.delete(players).where(eq(players.id, id));
  return NextResponse.json({ ok: true });
}
