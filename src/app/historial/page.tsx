"use client";
import useSWR from "swr";
import { useState } from "react";
import { AppHeader, Card, ChipDot, SectionTitle, CopyButton } from "@/components/ui";
import { money, signed } from "@/lib/poker";
import type { HistorySession } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HistorialPage() {
  const { data, isLoading } = useSWR<HistorySession[]>("/api/sessions", fetcher, {
    revalidateOnFocus: true,
  });
  const [openId, setOpenId] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <>
        <AppHeader />
        <SectionTitle>Historial</SectionTitle>
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Cargando…</div>
      </>
    );
  }

  if (!data.length) {
    return (
      <>
        <AppHeader />
        <SectionTitle>Historial</SectionTitle>
        <Card>
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 14px" }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>♥</div>
            No hay partidas cerradas aún.
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <SectionTitle>Historial</SectionTitle>
      {data.map((s) => {
        const isOpen = openId === s.id;
        const sorted = [...s.rows].sort((a, b) => b.net - a.net);
        return (
          <Card key={s.id} style={{ marginBottom: 10 }}>
            {/* Header row */}
            <div
              onClick={() => setOpenId(isOpen ? null : s.id)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {new Date(s.startedAt).toLocaleDateString("es-UY", {
                    weekday: "short", day: "2-digit", month: "short",
                  })}
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>
                  {s.rows.length} jugadores · pozo {money(s.totalIn)}
                </div>
              </div>
              <span style={{ color: "var(--gold)", fontWeight: 600, fontSize: 13 }}>
                {isOpen ? "ocultar ▲" : "ver ▼"}
              </span>
            </div>

            {isOpen && (
              <>
                <div style={{ height: 1, background: "var(--line)", margin: "12px 0" }} />

                {/* Results */}
                {sorted.map((row) => (
                  <div
                    key={row.playerId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 0",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ChipDot color={row.player?.color ?? "#888"} size={11} />
                      <span style={{ fontSize: 13 }}>{row.player?.name ?? "—"}</span>
                    </div>
                    <span
                      style={{
                        fontFamily: "var(--font-mono), monospace",
                        fontSize: 13,
                        fontWeight: 700,
                        color: row.net > 0 ? "var(--win)" : row.net < 0 ? "var(--loss)" : "var(--cream)",
                      }}
                    >
                      {signed(row.net)}
                    </span>
                  </div>
                ))}

                <div style={{ height: 1, background: "var(--line)", margin: "12px 0" }} />

                {/* Transfers */}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: "var(--gold)", marginBottom: 6, textTransform: "uppercase" }}>
                  Cómo saldar
                </div>

                {s.transfers.length === 0 ? (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>Quedaron parejos, nadie debe nada.</div>
                ) : (
                  s.transfers.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "14px 0",
                        borderBottom: "1px solid var(--line)",
                      }}
                    >
                      <span style={{ color: "var(--gold)", fontSize: 18, flexShrink: 0 }}>→</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13 }}>
                          <b>{t.from?.name ?? "—"}</b> le paga a <b>{t.to?.name ?? "—"}</b>
                        </div>
                        {t.to?.account ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 12, color: "var(--cream-dim)" }}>
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {t.to.bank ? `${t.to.bank} · ` : ""}{t.to.account}
                            </span>
                            <CopyButton text={t.to.account} />
                          </div>
                        ) : (
                          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>cuenta no cargada</div>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono), monospace",
                          fontWeight: 700,
                          fontSize: 16,
                          color: "var(--gold-bright)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {money(t.amount)}
                      </span>
                    </div>
                  ))
                )}
              </>
            )}
          </Card>
        );
      })}
    </>
  );
}
