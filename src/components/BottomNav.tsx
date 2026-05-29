"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/",
    label: "Mesa",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <ellipse cx="12" cy="12" rx="9" ry="6" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    href: "/ranking",
    label: "Ranking",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
  {
    href: "/historial",
    label: "Historial",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 3v18h18" /><path d="M7 14l4-4 3 3 5-6" />
      </svg>
    ),
  },
  {
    href: "/jugadores",
    label: "Jugadores",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
        <circle cx="17" cy="9" r="2.2" />
        <path d="M16 20c0-2 1.5-3.5 4-3.5" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: "linear-gradient(0deg,var(--felt) 60%,rgba(12,44,32,.85))",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          margin: "0 auto",
          display: "flex",
          padding: "9px 8px calc(9px + env(safe-area-inset-bottom,0px))",
        }}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                padding: "7px 2px",
                color: active ? "var(--gold-bright)" : "var(--muted)",
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: 0.3,
                textDecoration: "none",
              }}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
