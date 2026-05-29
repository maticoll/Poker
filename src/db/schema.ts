import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

export const sessionStatus = pgEnum("session_status", ["open", "closed"]);

export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  bank: text("bank").default(""),
  account: text("account").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: sessionStatus("status").notNull().default("open"),
  defaultBuyIn: integer("default_buy_in").notNull().default(1000),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});

export const sessionPlayers = pgTable(
  "session_players",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id),
    finalChips: integer("final_chips"),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.playerId] })]
);

export const buyIns = pgTable("buy_ins", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  playerId: uuid("player_id")
    .notNull()
    .references(() => players.id),
  amount: integer("amount").notNull(),
  addedBy: uuid("added_by").references(() => players.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transfers = pgTable("transfers", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  fromPlayerId: uuid("from_player_id")
    .notNull()
    .references(() => players.id),
  toPlayerId: uuid("to_player_id")
    .notNull()
    .references(() => players.id),
  amount: integer("amount").notNull(),
});
