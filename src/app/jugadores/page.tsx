"use client";
import useSWR from "swr";
import { useState } from "react";
import {
  AppHeader, Card, BtnGold, BtnGhost, ChipDot,
  SectionTitle, Sheet, FieldLabel, TextInput, Toast, CopyButton,
} from "@/components/ui";
import type { Player } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = (m: string) => { setMsg(m); setTimeout(() => setMsg(null), 1800); };
  return { msg, show };
}

function PlayerSheet({
  player,
  onClose,
  onSaved,
}: {
  player?: Player;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(player?.name ?? "");
  const [bank, setBank] = useState(player?.bank ?? "");
  const [account, setAccount] = useState(player?.account ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { msg, show } = useToast();

  const handleSave = async () => {
    if (!name.trim()) { show("Poné un nombre"); return; }
    setSaving(true);
    if (player) {
      await fetch(`/api/players/${player.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bank, account }),
      });
    } else {
      await fetch("/api/players", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), bank, account }),
      });
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  const handleDelete = async () => {
    if (!player) return;
    setDeleting(true);
    const res = await fetch(`/api/players/${player.id}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      show(d.error ?? "No se puede borrar");
      setDeleting(false);
      return;
    }
    setDeleting(false);
    onSaved();
    onClose();
  };

  return (
    <Sheet title={player ? "Editar jugador" : "Nuevo jugador"} onClose={onClose}>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Nombre</FieldLabel>
        <TextInput value={name} onChange={setName} placeholder="Ej: Nacho" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Banco / Alias</FieldLabel>
        <TextInput value={bank} onChange={setBank} placeholder="Ej: Itaú · Mi Dinero" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <FieldLabel>Cuenta / CBU / Alias para transferir</FieldLabel>
        <TextInput value={account} onChange={setAccount} placeholder="Número de cuenta o alias" />
      </div>
      <BtnGold onClick={handleSave} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</BtnGold>
      {player && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            display: "block", width: "100%", marginTop: 12, padding: "12px 0",
            background: "none", border: "none", color: "var(--loss)", fontFamily: "inherit",
            fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}
        >
          {deleting ? "Borrando…" : "Eliminar jugador"}
        </button>
      )}
      {msg && <Toast msg={msg} />}
    </Sheet>
  );
}

export default function JugadoresPage() {
  const { data: players, mutate } = useSWR<Player[]>("/api/players", fetcher, { revalidateOnFocus: true });
  const [editPlayer, setEditPlayer] = useState<Player | undefined | null>(null); // null = closed, undefined = new
  const { msg, show } = useToast();

  if (!players) {
    return (
      <>
        <AppHeader />
        <SectionTitle>Jugadores y cuentas</SectionTitle>
        <div style={{ textAlign: "center", color: "var(--muted)", padding: 40 }}>Cargando…</div>
      </>
    );
  }

  return (
    <>
      <AppHeader />
      <SectionTitle>Jugadores y cuentas</SectionTitle>

      <BtnGold onClick={() => setEditPlayer(undefined)} style={{ marginBottom: 14 }}>
        + Agregar jugador
      </BtnGold>

      {players.length === 0 ? (
        <Card>
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "30px 14px" }}>
            Sin jugadores todavía.
          </div>
        </Card>
      ) : (
        players.map((p) => (
          <Card key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <ChipDot color={p.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {p.account
                  ? `${p.bank ? p.bank + " · " : ""}${p.account}`
                  : "sin cuenta cargada"}
              </div>
            </div>
            {p.account && <CopyButton text={p.account} />}
            <BtnGhost onClick={() => setEditPlayer(p)} style={{ flexShrink: 0 }}>editar</BtnGhost>
          </Card>
        ))
      )}

      {/* editPlayer === null means closed; undefined means new; Player means editing */}
      {editPlayer !== null && (
        <PlayerSheet
          player={editPlayer}
          onClose={() => setEditPlayer(null)}
          onSaved={() => mutate()}
        />
      )}

      {msg && <Toast msg={msg} />}
    </>
  );
}
