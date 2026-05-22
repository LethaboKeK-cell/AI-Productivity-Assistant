import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Mail,
  FileText,
  Calendar,
  Sparkles,
  CloudRain,
  Settings,
  Menu,
  X,
  Lock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";

type NavItem = {
  to: "/" | "/email" | "/notes" | "/planner" | "/settings";
  label: string;
  code: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { to: "/", label: "Clearing", code: "00", icon: LayoutDashboard, exact: true },
  { to: "/email", label: "Letterbark", code: "01", icon: Mail },
  { to: "/notes", label: "Field Journal", code: "02", icon: FileText },
  { to: "/planner", label: "Trail Map", code: "03", icon: Calendar },
  { to: "/settings", label: "Hollow", code: "04", icon: Settings },
];

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const privacyMode = useStore((s) => s.preferences.privacyMode);
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen text-foreground flex relative">
      <div className="starfield" aria-hidden />

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 h-14 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg grid place-items-center font-display font-bold text-primary-foreground bg-gradient-to-br from-primary to-accent">
            <span>Æ</span>
          </div>
          <span className="font-display text-sm font-semibold tracking-wide">AEON</span>
        </Link>
        <button
          onClick={() => setOpen((v) => !v)}
          className="size-9 rounded-md border border-border/60 grid place-items-center"
          aria-label="Toggle navigation"
        >
          {open ? <X className="size-4" /> : <Menu className="size-4" />}
        </button>
      </header>

      {/* Sidebar — drawer on mobile, sticky on desktop */}
      <aside
        className={[
          "z-20 flex flex-col p-6 gap-7 backdrop-blur-xl bg-background/40 border-r border-border/60",
          "fixed lg:sticky top-0 h-screen w-72 shrink-0",
          "transition-transform lg:transition-none",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <Link to="/" className="hidden lg:flex items-center gap-3">
          <div className="relative size-11 rounded-xl grid place-items-center font-display font-bold text-primary-foreground bg-gradient-to-br from-primary to-accent pulse-glow">
            <span className="relative z-10">Æ</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold tracking-wide">Aeon</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Forest Suite v3
            </span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1.5 mt-12 lg:mt-0">
          <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70 px-3 mb-3 font-mono">
            ❀ Trails
          </p>
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={[
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border",
                  active
                    ? "glass text-foreground border-primary/40 shadow-glow"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20 hover:border-border",
                ].join(" ")}
              >
                <span className="font-mono text-[10px] text-primary/70 w-5">{item.code}</span>
                <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary shadow-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="glass rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs mb-2">
            <CloudRain className="size-3.5 text-primary" />
            <span className="uppercase tracking-[0.25em] text-[9px] font-mono text-primary">
              {privacyMode === "local" ? "Local · Offline" : privacyMode === "encrypted" ? "Encrypted Vault" : "Cloud · Online"}
            </span>
          </div>
          <p className="text-xs text-foreground/80 leading-snug flex items-start gap-2">
            {privacyMode === "local" ? (
              <WifiOff className="size-3 mt-0.5 shrink-0" />
            ) : privacyMode === "encrypted" ? (
              <Lock className="size-3 mt-0.5 shrink-0" />
            ) : (
              <Wifi className="size-3 mt-0.5 shrink-0" />
            )}
            <span>
              {privacyMode === "local"
                ? "Drafting on-device only. No data leaves your machine."
                : privacyMode === "encrypted"
                  ? "Notes & drafts encrypted at rest with your passphrase."
                  : "Forest-grown drafts, summaries, and trail maps."}
            </span>
          </p>
          <Sparkles className="absolute -bottom-2 -right-2 size-16 text-primary/5" />
        </div>
      </aside>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-10 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex-1 overflow-y-auto relative z-10 pt-14 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  code,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  code?: string;
}) {
  return (
    <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6 mb-8 lg:mb-10 pb-5 lg:pb-6 border-b border-border/60">
      <div>
        {code && (
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary/80 mb-3 flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-primary shadow-glow" />
            {code}
          </p>
        )}
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-2 bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
