export interface Player {
  id: string;
  name: string;
  color: string;
  bank: string;
  account: string;
  createdAt: string;
}

export interface BuyIn {
  id: string;
  amount: number;
  createdAt: string;
}

export interface SessionRow {
  playerId: string;
  player: Player | null;
  buyIns: BuyIn[];
  totalIn: number;
  finalChips: number | null;
  net: number;
}

export interface CurrentSession {
  id: string;
  status: "open" | "closed";
  defaultBuyIn: number;
  startedAt: string;
  closedAt: string | null;
  rows: SessionRow[];
  totalIn: number;
}

export interface HistoryTransfer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  amount: number;
  from: Player | null;
  to: Player | null;
}

export interface HistorySessionRow {
  playerId: string;
  player: Player | null;
  totalIn: number;
  finalChips: number | null;
  net: number;
}

export interface HistorySession {
  id: string;
  status: "closed";
  defaultBuyIn: number;
  startedAt: string;
  closedAt: string | null;
  rows: HistorySessionRow[];
  totalIn: number;
  transfers: HistoryTransfer[];
}

export interface RankingEntry {
  id: string;
  total: number;
  games: number;
  best: number;
  worst: number;
  player: Player | null;
}
