"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";
import {
  AppHeader, Card, BtnGold, BtnGhost, BtnSoft,
  ChipDot, Sheet, FieldLabel, TextInput, Toast,
} from "@/components/ui";
import { money, signed, fmt } from "@/lib/poker";
import type { CurrentSession, Player, SessionRow } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 1800);
  };
  return { msg, show };
}

// ---- BuyIn Sheet ----
function BuyInSheet({
  player, sessionId, defaultBuyIn, onClose, onDone,
}: {
  player: Player; sessionId: string; defaultBuyIn: number; onClose: () => void; onDone: () => void;
}) {
  const presets = [500, 1000, 2000, 5000];
  const [selected, setSelected] = useState(defaultBuyIn);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    const amount = custom ? parseInt(custom) : selected;
    if (!amount || amount <= 0) return;
    setLoading(true);
    const currentPlayerId = localStorage.getItem("currentPlayerId") ?? undefined;
    await fetch("/api/buyins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, playerId: player.id, amount, addedBy: currentPlayerId }),
    });
    setLoading(false);
    onDone();
    onClose();
  };

  return (
    <Sheet title={`Agregar monto — ${player.name}`} onClose={onClose}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
        {presets.map((v) => (
          <button key={v} onClick={() => { setSelected(v); setCustom(""); }}
            style={{
              padding: "9px 14px", borderRadius: 11,
              background: selected === v && !custom ? "var(--gold)" : "rgba(255,255,255,.06)",
              border: `1px solid ${selected === v && !custom ? "var(--gold)" : "var(--line)"}`,
              color: selected === v && !custom ? "#33260c" : "var(--cream)",
              fontFamily: "var(--font-mono), monospace", fontWeight: 700, fontSize: 13, cursor: "pointer",
            }}
          >${fmt(v)}</button>
        ))}
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Otro monto</FieldLabel>
        <TextInput type="number" inputMode="numeric" value={custom}
          onChange={(v) => { setCustom(v); if (v) setSelected(0); }} placeholder="Monto personalizado" />
      </div>
      <BtnGold onClick={handleAdd} disabled={loading}>Agregar monto</BtnGold>
    </Sheet>
  );
}

// ---- Early Exit Sheet ----
function EarlyExitSheet({ player, totalIn, onClose, onDone }: {
  player: Player; totalIn: number; onClose: () => void; onDone: (chips: number) => void;
}) {
  const [chips, setChips] = useState("");
  const chipNum = chips === "" ? null : parseInt(chips);
  const net = chipNum !== null ? chipNum - totalIn : null;

  return (
    <Sheet title={`${player.name} se va`} onClose={onClose}>
      <p style={{ fontSize: 13, color: "var(--cream-dim)", margin: "0 0 16px" }}>
        Invirtió <strong style={{ color: "var(--cream)", fontFamily: "var(--font-mono), monospace" }}>{money(totalIn)}</strong>. Cargá con cuánto se va.
      </p>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Fichas finales</FieldLabel>
        <TextInput type="number" inputMode="numeric" value={chips} onChange={setChips} placeholder="$" />
      </div>
      {net !== null && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 16, padding: "10px 13px", borderRadius: 11, background: "rgba(255,255,255,.04)", border: "1px solid var(--line)" }}>
          <span style={{ color: "var(--muted)" }}>Resultado</span>
          <span style={{
            fontFamily: "var(--font-mono), monospace", fontWeight: 700,
            color: net > 0 ? "var(--win)" : net < 0 ? "var(--loss)" : "var(--cream)",
          }}>{signed(net)}</span>
        </div>
      )}
      <BtnGold
        onClick={() => { if (chipNum !== null && chipNum >= 0) onDone(chipNum); }}
        disabled={chipNum === null || chipNum < 0}
      >
        Registrar salida
      </BtnGold>
    </Sheet>
  );
}

// ---- Settings Sheet ----
function SettingsSheet({ defaultBuyIn, onClose, onSave }: {
  defaultBuyIn: number; onClose: () => void; onSave: (v: number) => void;
}) {
  const [val, setVal] = useState(String(defaultBuyIn));
  return (
    <Sheet title="Ajustes" onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Buy-in inicial por defecto</FieldLabel>
        <TextInput type="number" inputMode="numeric" value={val} onChange={setVal} placeholder="1000" />
      </div>
      <BtnGold onClick={() => { const v = parseInt(val); if (v > 0) { onSave(v); onClose(); } }}>
        Guardar
      </BtnGold>
    </Sheet>
  );
}

// ---- New Session picker ----
function NewSessionView({ players, onStart }: { players: Player[]; onStart: (ids: string[], buyIn: number) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const [defaultBuyIn, setDefaultBuyIn] = useState(() => {
    if (typeof window !== "undefined") return parseInt(localStorage.getItem("defaultBuyIn") ?? "1000") || 1000;
    return 1000;
  });
  const [showSettings, setShowSettings] = useState(false);
  const { msg, show } = useToast();

  const toggle = (id: string) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  if (players.length < 2) return (
    <Card>
      <div style={{ textAlign: "center", color: "var(--muted)", padding: "40px 14px" }}>
        <div style={{ fontSize: 34, marginBottom: 10 }}>♣</div>
        Agregá al menos 2 jugadores en <b>Jugadores</b> para arrancar.
      </div>
    </Card>
  );

  return (
    <>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 19, fontWeight: 600 }}>Nueva partida</div>
          <BtnSoft onClick={() => setShowSettings(true)} style={{ fontSize: 12, padding: "7px 11px" }}>
            ⚙ Buy-in ${fmt(defaultBuyIn)}
          </BtnSoft>
        </div>
        <p style={{ fontSize: 12, color: "var(--cream-dim)", margin: "0 2px 14px" }}>
          Cada uno arranca con ${fmt(defaultBuyIn)}.
        </p>
        {players.map((p) => {
          const on = picked.includes(p.id);
          return (
            <div key={p.id} onClick={() => toggle(p.id)} style={{
              display: "flex", alignItems: "center", gap: 11, padding: "12px 13px",
              border: `1px solid ${on ? "var(--line-strong)" : "var(--line)"}`, borderRadius: 13, marginBottom: 8,
              background: on ? "rgba(214,189,128,.1)" : "transparent", cursor: "pointer",
            }}>
              <ChipDot color={p.color} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
              <div style={{
                marginLeft: "auto", width: 22, height: 22, borderRadius: 7,
                border: `2px solid ${on ? "var(--gold)" : "var(--line-strong)"}`,
                background: on ? "var(--gold)" : "transparent", color: "#33260c",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800,
              }}>{on && "✓"}</div>
            </div>
          );
        })}
        <BtnGold onClick={() => { if (picked.length < 2) { show("Elegí al menos 2 jugadores"); return; } onStart(picked, defaultBuyIn); }} style={{ marginTop: 8 }}>
          Arrancar partida ({picked.length})
        </BtnGold>
      </Card>
      {showSettings && <SettingsSheet defaultBuyIn={defaultBuyIn} onClose={() => setShowSettings(false)}
        onSave={(v) => { setDefaultBuyIn(v); localStorage.setItem("defaultBuyIn", String(v)); }} />}
      {msg && <Toast msg={msg} />}
    </>
  );
}

// ---- Active Session ----
function ActiveSessionView({ session, allPlayers, onMutate, onCountingStart }: {
  session: CurrentSession; allPlayers: Player[]; onMutate: () => void; onCountingStart: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [buyInSheet, setBuyInSheet] = useState<Player | null>(null);
  const [earlyExitSheet, setEarlyExitSheet] = useState<{ player: Player; totalIn: number } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { msg, show } = useToast();

  const inGameIds = new Set(session.rows.map((r) => r.playerId));
  const outsiders = allPlayers.filter((p) => !inGameIds.has(p.id));

  const undoBuyIn = async (playerId: string) => {
    const res = await fetch("/api/buyins/last", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session.id, playerId }),
    });
    if (!res.ok) { const d = await res.json(); show(d.error ?? "Error"); }
    onMutate();
  };
  const removePlayer = async (playerId: string) => {
    await fetch(`/api/sessions/${session.id}/players/${playerId}`, { method: "DELETE" });
    onMutate();
  };
  const addPlayer = async (playerId: string) => {
    await fetch(`/api/sessions/${session.id}/players`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    });
    onMutate();
  };
  const recordEarlyExit = async (playerId: string, finalChips: number) => {
    await fetch(`/api/sessions/${session.id}/players/${playerId}/chips`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalChips }),
    });
    setEarlyExitSheet(null);
    setExpandedId(null);
    onMutate();
  };
  const cancelSession = async () => {
    await fetch(`/api/sessions/${session.id}`, { method: "DELETE" });
    onMutate();
    setConfirmCancel(false);
  };

  return (
    <>
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase" }}>PARTIDA EN CURSO</div>
          <div style={{ fontSize: 11, color: "var(--cream-dim)", marginTop: 2 }}>
            {new Date(session.startedAt).toLocaleDateString("es-UY", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "var(--muted)" }}>En la mesa</div>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 20, fontWeight: 700 }}>{money(session.totalIn)}</div>
        </div>
      </Card>

      {session.rows.map((row) => {
        const isExpanded = expandedId === row.playerId;
        const leftEarly = row.finalChips !== null;
        const rebuys = row.buyIns.length - 1;
        const net = leftEarly ? row.finalChips! - row.totalIn : null;

        return (
          <Card key={row.playerId} style={{ marginTop: 10, opacity: leftEarly ? 0.75 : 1 }}>
            {/* Tappable header */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : row.playerId)}
              style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", paddingBottom: isExpanded ? 12 : 0, borderBottom: isExpanded ? "1px solid var(--line)" : "none" }}
            >
              <ChipDot color={row.player?.color ?? "#888"} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 16 }}>{row.player?.name ?? "—"}</span>
                {leftEarly && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>Se fue · {rebuys > 0 ? `${rebuys} recompra${rebuys > 1 ? "s" : ""} · ` : ""}resultado: <span style={{ color: net! > 0 ? "var(--win)" : net! < 0 ? "var(--loss)" : "var(--cream)", fontFamily: "var(--font-mono), monospace", fontWeight: 700 }}>{signed(net!)}</span></div>
                )}
                {!leftEarly && rebuys > 0 && (
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>{rebuys} recompra{rebuys > 1 ? "s" : ""}</div>
                )}
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-mono), monospace", fontWeight: 700, fontSize: 18 }}>{money(row.totalIn)}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>{isExpanded ? "▲" : "▼"}</div>
              </div>
            </div>

            {/* Expanded actions */}
            {isExpanded && (
              <div style={{ paddingTop: 12 }}>
                {leftEarly ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <BtnGhost onClick={() => setEarlyExitSheet({ player: row.player!, totalIn: row.totalIn })}>Editar salida</BtnGhost>
                    <BtnGhost onClick={() => removePlayer(row.playerId)} style={{ marginLeft: "auto", color: "var(--muted)" }}>Quitar de sesión</BtnGhost>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <BtnGold onClick={() => { setBuyInSheet(row.player); setExpandedId(null); }} style={{ flex: 1, justifyContent: "center" }}>
                      Agregar monto
                    </BtnGold>
                    <BtnSoft onClick={() => { setEarlyExitSheet({ player: row.player!, totalIn: row.totalIn }); }} style={{ flex: 1, justifyContent: "center" }}>
                      Se va antes
                    </BtnSoft>
                    {row.buyIns.length > 1 && (
                      <BtnGhost onClick={() => undoBuyIn(row.playerId)} style={{ width: "100%", justifyContent: "center" }}>↶ deshacer última recompra</BtnGhost>
                    )}
                    <BtnGhost onClick={() => removePlayer(row.playerId)} style={{ width: "100%", justifyContent: "center", color: "var(--muted)" }}>Quitar de sesión</BtnGhost>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {outsiders.length > 0 && (
        <Card style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, color: "var(--cream-dim)", marginBottom: 8 }}>Sumar a la mesa</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {outsiders.map((p) => <BtnGhost key={p.id} onClick={() => addPlayer(p.id)}><ChipDot color={p.color} size={11} /> {p.name}</BtnGhost>)}
          </div>
        </Card>
      )}

      <BtnGold style={{ marginTop: 14 }} onClick={onCountingStart}>Cerrar partida y contar fichas</BtnGold>
      <button onClick={() => setConfirmCancel(true)} style={{
        display: "block", width: "100%", marginTop: 10, background: "none", border: "none",
        color: "var(--muted)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "12px 0", cursor: "pointer",
      }}>Cancelar partida</button>

      {buyInSheet && <BuyInSheet player={buyInSheet} sessionId={session.id} defaultBuyIn={session.defaultBuyIn}
        onClose={() => setBuyInSheet(null)} onDone={onMutate} />}
      {earlyExitSheet && (
        <EarlyExitSheet
          player={earlyExitSheet.player}
          totalIn={earlyExitSheet.totalIn}
          onClose={() => setEarlyExitSheet(null)}
          onDone={(chips) => recordEarlyExit(earlyExitSheet.player.id, chips)}
        />
      )}
      {confirmCancel && (
        <Sheet title="¿Cancelar partida?" onClose={() => setConfirmCancel(false)}>
          <p style={{ fontSize: 13, color: "var(--cream-dim)", margin: "0 0 16px" }}>Se borra la partida en curso y no queda registrada.</p>
          <button onClick={cancelSession} style={{
            display: "block", width: "100%", padding: "13px 16px", borderRadius: 13,
            background: "var(--loss)", color: "#3a0d0d", fontFamily: "inherit", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", marginBottom: 10,
          }}>Sí, cancelar</button>
          <BtnGhost onClick={() => setConfirmCancel(false)} style={{ width: "100%", justifyContent: "center" }}>No, volver</BtnGhost>
        </Sheet>
      )}
      {msg && <Toast msg={msg} />}
    </>
  );
}

// ---- Counting view ----
function CountingView({ session, onBack, onClosed }: {
  session: CurrentSession; onBack: () => void; onClosed: () => void;
}) {
  const [chips, setChips] = useState<Record<string, string>>({});
  const [closing, setClosing] = useState(false);
  const { msg, show } = useToast();

  const getChip = (row: SessionRow): number | null => {
    const v = chips[row.playerId];
    if (v !== undefined) return v === "" ? null : parseInt(v);
    return row.finalChips;
  };

  const allFilled = session.rows.every((r) => getChip(r) !== null);
  const totalChips = session.rows.reduce((a, r) => { const c = getChip(r); return c !== null ? a + c : a; }, 0);
  const totalIn = session.rows.reduce((a, r) => a + r.totalIn, 0);
  const balanceDiff = allFilled ? totalChips - totalIn : null;

  const updateChips = async (playerId: string, val: string) => {
    setChips((prev) => ({ ...prev, [playerId]: val }));
    const amount = val === "" ? null : parseInt(val);
    await fetch(`/api/sessions/${session.id}/players/${playerId}/chips`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalChips: amount }),
    });
  };

  const handleClose = async () => {
    setClosing(true);
    const res = await fetch(`/api/sessions/${session.id}/close`, { method: "POST" });
    const data = await res.json();
    setClosing(false);
    if (!res.ok) {
      show(data.diff !== undefined
        ? `Descuadre: ${data.diff > 0 ? "sobran" : "faltan"} ${money(Math.abs(data.diff))}`
        : (data.error ?? "Error"));
      return;
    }
    onClosed();
  };

  return (
    <>
      <Card>
        <div style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 19, fontWeight: 600, marginBottom: 4 }}>Conteo final</div>
        <p style={{ fontSize: 12, color: "var(--cream-dim)", margin: 0 }}>Cargá con cuánto quedó cada uno.</p>
      </Card>
      {session.rows.map((row) => {
        const leftEarly = row.finalChips !== null && chips[row.playerId] === undefined;
        const chipVal = chips[row.playerId] ?? (row.finalChips !== null ? String(row.finalChips) : "");
        const chipNum = chipVal === "" ? null : parseInt(chipVal);
        const netVal = chipNum !== null ? chipNum - row.totalIn : null;
        return (
          <Card key={row.playerId} style={{ marginTop: 10, opacity: leftEarly ? 0.7 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <ChipDot color={row.player?.color ?? "#888"} />
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{row.player?.name ?? "—"}</span>
                  {leftEarly && <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: 1, textTransform: "uppercase", marginTop: 1 }}>Se fue antes</div>}
                </div>
              </div>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>invirtió {money(row.totalIn)}</span>
            </div>
            {leftEarly ? (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "10px 13px", borderRadius: 11, background: "rgba(255,255,255,.04)", border: "1px solid var(--line)" }}>
                <span style={{ color: "var(--muted)" }}>Fichas registradas</span>
                <span style={{ fontFamily: "var(--font-mono), monospace", fontWeight: 700 }}>{money(row.finalChips!)}</span>
              </div>
            ) : (
              <TextInput type="number" inputMode="numeric" value={chipVal} onChange={(v) => updateChips(row.playerId, v)} placeholder="Fichas finales $" />
            )}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8 }}>
              <span style={{ color: "var(--muted)" }}>Resultado</span>
              <span style={{
                fontFamily: "var(--font-mono), monospace", fontWeight: 700,
                color: netVal === null ? "var(--muted)" : netVal > 0 ? "var(--win)" : netVal < 0 ? "var(--loss)" : "var(--cream)",
              }}>{netVal === null ? "—" : signed(netVal)}</span>
            </div>
          </Card>
        );
      })}
      <Card style={{ marginTop: 10 }}>
        {!allFilled ? (
          <span style={{ fontSize: 12, color: "var(--cream-dim)" }}>Falta cargar fichas de {session.rows.filter((r) => getChip(r) === null).length} jugador(es)</span>
        ) : balanceDiff === 0 ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "var(--cream-dim)" }}>Total fichas vs. mesa</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, background: "rgba(95,211,154,.15)", color: "var(--win)", border: "1px solid rgba(95,211,154,.3)" }}>✓ Cuadra · {money(totalChips)}</span>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--cream-dim)" }}>Descuadre</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, background: "rgba(239,111,111,.15)", color: "var(--loss)", border: "1px solid rgba(239,111,111,.3)" }}>
                {(balanceDiff ?? 0) > 0 ? "sobran" : "faltan"} {money(Math.abs(balanceDiff ?? 0))}
              </span>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
              Fichas ({money(totalChips)}) deben sumar el pozo ({money(totalIn)}). Revisá el conteo.
            </div>
          </>
        )}
      </Card>
      <BtnGold style={{ marginTop: 14 }} onClick={handleClose} disabled={!allFilled || balanceDiff !== 0 || closing}>
        {closing ? "Calculando…" : "Calcular y saldar"}
      </BtnGold>
      <button onClick={onBack} style={{ display: "block", width: "100%", marginTop: 10, background: "none", border: "none", color: "var(--muted)", fontFamily: "inherit", fontSize: 14, fontWeight: 700, padding: "12px 0", cursor: "pointer" }}>
        ← Volver a la mesa
      </button>
      {msg && <Toast msg={msg} />}
    </>
  );
}

// ---- Identity Selector ----
function IdentitySheet({ players, onSelect, onSkip }: {
  players: Player[]; onSelect: (id: string) => void; onSkip: () => void;
}) {
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/players", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const p = await res.json();
    setCreating(false);
    onSelect(p.id);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(4,18,12,.9)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "var(--panel-solid)", border: "1px solid var(--line-strong)", borderBottom: "none", borderRadius: "22px 22px 0 0", padding: "24px 18px calc(32px + env(safe-area-inset-bottom,0px))" }}>
        <h3 style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 24, margin: "0 0 6px", color: "var(--cream)" }}>¿Quién sos?</h3>
        <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 18px" }}>Elegí tu jugador para cargar recompras.</p>
        {players.map((p) => (
          <div key={p.id} onClick={() => onSelect(p.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", border: "1px solid var(--line)", borderRadius: 13, marginBottom: 8, cursor: "pointer" }}>
            <ChipDot color={p.color} />
            <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
          </div>
        ))}
        <div style={{ marginTop: 14, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>O creá tu jugador:</p>
          <TextInput value={newName} onChange={setNewName} placeholder="Tu nombre" />
          <BtnGold onClick={handleCreate} disabled={creating} style={{ marginTop: 10 }}>Soy nuevo — crear jugador</BtnGold>
        </div>
        <button onClick={onSkip} style={{ display: "block", width: "100%", marginTop: 12, background: "none", border: "none", color: "var(--muted)", fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
          Saltear por ahora
        </button>
      </div>
    </div>
  );
}

// ---- Main ----
export default function MesaPage() {
  const { data: session, mutate: mutateSession } = useSWR<CurrentSession | null>(
    "/api/sessions/current", fetcher,
    { refreshInterval: 4000, revalidateOnFocus: true }
  );
  const { data: players, mutate: mutatePlayers } = useSWR<Player[]>("/api/players", fetcher);

  const [counting, setCounting] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [showIdentity, setShowIdentity] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const id = localStorage.getItem("currentPlayerId");
    setCurrentPlayerId(id);
    if (!id) setShowIdentity(true);
  }, []);

  const handleClosed = () => {
    mutateSession(null);
    setCounting(false);
    window.location.href = "/historial";
  };

  const handleStart = async (ids: string[], buyIn: number) => {
    await fetch("/api/sessions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerIds: ids, defaultBuyIn: buyIn }),
    });
    mutateSession();
  };

  const handleMutate = () => { mutateSession(); mutatePlayers(); };

  const selectIdentity = (id: string) => {
    localStorage.setItem("currentPlayerId", id);
    setCurrentPlayerId(id);
    setShowIdentity(false);
    mutatePlayers();
  };

  if (!hydrated || session === undefined || players === undefined) {
    return (
      <>
        <AppHeader />
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Cargando…</div>
      </>
    );
  }

  const currentPlayerName = players?.find((p) => p.id === currentPlayerId)?.name;

  return (
    <>
      <AppHeader />

      {/* Identity pill */}
      {hydrated && (
        <div style={{ position: "absolute", top: 28, right: 16, zIndex: 10 }}>
          <button onClick={() => setShowIdentity(true)} style={{
            background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 10,
            padding: "6px 11px", fontSize: 12, fontWeight: 600, color: "var(--gold)", cursor: "pointer", fontFamily: "inherit",
          }}>
            {currentPlayerName ?? "¿Quién sos?"}
          </button>
        </div>
      )}

      {session && counting ? (
        <CountingView session={session} onBack={() => setCounting(false)} onClosed={handleClosed} />
      ) : session ? (
        <ActiveSessionView session={session} allPlayers={players ?? []} onMutate={handleMutate} onCountingStart={() => setCounting(true)} />
      ) : (
        <NewSessionView players={players ?? []} onStart={handleStart} />
      )}

      {showIdentity && players && (
        <IdentitySheet players={players} onSelect={selectIdentity} onSkip={() => setShowIdentity(false)} />
      )}
    </>
  );
}
