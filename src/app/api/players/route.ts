export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server";
import { db } from "@/db";
import { players, sessionPlayers, buyIns } from "@/db/schema";
import { PLAYER_COLORS } from "@/lib/poker";
import { eq, or, count } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(players).orderBy(players.createdAt);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, bank = "", account = "" } = body;
  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const existing = await db.select({ count: count() }).from(players);
  const colorIndex = Number(existing[0].count) % PLAYER_COLORS.length;
  const color = PLAYER_COLORS[colorIndex];

  const [player] = await db
    .insert(players)
    .values({ name: name.trim(), color, bank, account })
    .returning();

  return NextResponse.json(player, { status: 201 });
}
