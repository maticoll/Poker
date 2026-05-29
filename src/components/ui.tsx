"use client";
import { useCallback } from "react";

export function copyToClipboard(text: string, onDone: () => void) {
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      onDone();
    } catch {
      // ignore
    }
    ta.remove();
  };

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(onDone).catch(fallback);
  } else {
    fallback();
  }
}

export function CopyButton({ text, className }: { text: string; className?: string }) {
  const handleCopy = useCallback(() => {
    const btn = document.activeElement as HTMLButtonElement | null;
    copyToClipboard(text, () => {
      if (btn) {
        const prev = btn.textContent;
        btn.textContent = "✓ copiado";
        btn.style.background = "rgba(95,211,154,.18)";
        btn.style.color = "var(--win)";
        setTimeout(() => {
          btn.textContent = prev;
          btn.style.background = "";
          btn.style.color = "";
        }, 1500);
      }
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={className}
      style={{
        background: "rgba(214,189,128,.14)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        padding: "4px 9px",
        fontSize: 11,
        fontWeight: 700,
        color: "var(--gold-bright)",
        display: "inline-flex",
        gap: 5,
        alignItems: "center",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background .15s, color .15s",
      }}
    >
      ⧉ copiar
    </button>
  );
}

export function ChipDot({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: color,
        boxShadow: "0 0 0 2px rgba(0,0,0,.25), inset 0 0 0 2px rgba(255,255,255,.25)",
        display: "inline-block",
      }}
    />
  );
}

export function Card({
  children,
  style,
  className,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--panel-solid)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-fraunces), Fraunces, serif",
        fontSize: 21,
        fontWeight: 600,
        margin: "22px 2px 12px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        color: "var(--cream)",
      }}
    >
      {children}
    </div>
  );
}

export function BtnGold({
  children,
  onClick,
  disabled,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 13,
        padding: "13px 16px",
        fontWeight: 700,
        fontSize: 15,
        background: "linear-gradient(180deg,var(--gold-bright),var(--gold))",
        color: "#33260c",
        boxShadow: "0 8px 20px -8px rgba(214,189,128,.6)",
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.45 : 1,
        transition: "opacity .15s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function BtnGhost({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 11,
        padding: "9px 12px",
        minHeight: 44,
        fontWeight: 700,
        fontSize: 13,
        background: "rgba(255,255,255,.05)",
        border: "1px solid var(--line)",
        color: "var(--cream)",
        cursor: "pointer",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function BtnSoft({
  children,
  onClick,
  style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 11,
        padding: "9px 12px",
        minHeight: 44,
        fontWeight: 700,
        fontSize: 13,
        background: "rgba(214,189,128,.14)",
        color: "var(--gold-bright)",
        border: "1px solid var(--line)",
        cursor: "pointer",
        fontFamily: "inherit",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Sheet({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        background: "rgba(4,18,12,.72)",
        backdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        animation: "fadeIn .2s",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "var(--panel-solid)",
          border: "1px solid var(--line-strong)",
          borderBottom: "none",
          borderRadius: "22px 22px 0 0",
          padding: "20px 18px calc(22px + env(safe-area-inset-bottom,0px))",
          boxShadow: "0 -20px 50px -10px rgba(0,0,0,.6)",
          animation: "slideUp .25s cubic-bezier(.2,.8,.2,1)",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-fraunces), Fraunces, serif",
            fontWeight: 600,
            fontSize: 22,
            margin: "2px 0 16px",
            color: "var(--cream)",
          }}
        >
          {title}
        </h3>
        {children}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } }
        @keyframes slideUp { from { transform: translateY(100%); } }
      `}</style>
    </div>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        fontSize: 12,
        color: "var(--gold)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        display: "block",
        marginBottom: 6,
        marginLeft: 2,
      }}
    >
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <input
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        fontFamily: "inherit",
        fontSize: 16,
        color: "var(--cream)",
        background: "rgba(0,0,0,.22)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding: "13px 14px",
        outline: "none",
      }}
    />
  );
}

export function Toast({ msg }: { msg: string }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 96,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        background: "var(--panel-solid)",
        border: "1px solid var(--line-strong)",
        color: "var(--cream)",
        padding: "11px 18px",
        borderRadius: 13,
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "var(--shadow)",
        whiteSpace: "nowrap",
        pointerEvents: "none",
      }}
    >
      {msg}
    </div>
  );
}

export function AppHeader() {
  return (
    <header
      style={{
        padding: "26px 2px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "var(--font-fraunces), Fraunces, serif",
            fontWeight: 600,
            fontSize: 30,
            letterSpacing: 0.5,
            margin: 0,
            lineHeight: 1,
            color: "var(--cream)",
          }}
        >
          El Pozo
          <span
            style={{
              display: "inline-block",
              width: 9,
              height: 9,
              borderRadius: 2,
              transform: "rotate(45deg)",
              background: "var(--gold)",
              marginLeft: 4,
            }}
          />
        </h1>
        <div
          style={{
            color: "var(--gold)",
            fontSize: 11,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginTop: 5,
            fontWeight: 600,
          }}
        >
          Saldá tu mesa
        </div>
      </div>
    </header>
  );
}
