import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type DB = ReturnType<typeof createDb>;

function createDb() {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const sql = neon(url);
  return drizzle(sql, { schema });
}

let _db: DB | null = null;

export function getDb(): DB {
  if (!_db) _db = createDb();
  return _db;
}

// Lazy proxy so the module can be imported at build time without crashing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = new Proxy({} as DB, {
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getDb() as any)[prop];
  },
});
