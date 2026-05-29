"use client";
import useSWR from "swr";
import { AppHeader, Card, ChipDot, SectionTitle } from "@/components/ui";
import { signed } from "@/lib/poker";
import type { RankingEntry } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function RankingPage() {
  const { data, isLoading } = useSWR<RankingEntry[]>("/api/ranking", fetcher, {
    revalidateOnFocus: true,
  });

  if (isLoading || !data) {
    return (
      <>
        <AppHeader />
        <SectionTitle>Ranking global</SectionTitle>
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Cargando…</div>
      </>
    );
  }

  if (!data.length) {
    return (
      <>
        <AppHeader />
        <SectionTitle>Ranking global</SectionTitle>
        <Card>
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 14px" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>♦</div>
            Todavía no hay partidas cerradas. El ranking aparece cuando cierres la primera.
          </div>
        </Card>
      </>
    );
  }

  const maxAbs = Math.max(...data.map((m) => Math.abs(m.total)), 1);

  return (
    <>
      <AppHeader />
      <SectionTitle>Ranking global</SectionTitle>
      <Card>
        {data.map((entry, i) => {
          const barPct = (Math.abs(entry.total) / maxAbs) * 100;
          const isWin = entry.total >= 0;
          return (
            <div
              key={entry.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "13px 0",
                borderBottom: i < data.length - 1 ? "1px solid var(--line)" : "none",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-fraunces), serif",
                  fontStyle: "italic",
                  fontSize: 20,
                  width: 26,
                  textAlign: "center",
                  color: "var(--gold)",
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </span>
              <ChipDot color={entry.player?.color ?? "#888"} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{entry.player?.name ?? "—"}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {entry.games} partida{entry.games !== 1 ? "s" : ""} · mejor {signed(entry.best)}
                </div>
                <div
                  style={{
                    height: 5,
                    borderRadius: 3,
                    marginTop: 5,
                    background: "rgba(255,255,255,.07)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barPct}%`,
                      borderRadius: 3,
                      background: isWin ? "var(--win)" : "var(--loss)",
                    }}
                  />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    fontWeight: 700,
                    fontSize: 17,
                    color: entry.total > 0 ? "var(--win)" : entry.total < 0 ? "var(--loss)" : "var(--cream)",
                  }}
                >
                  {signed(entry.total)}
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}
