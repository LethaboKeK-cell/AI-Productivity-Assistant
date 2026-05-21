import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Mail, FileText, Calendar, Sparkles, Radar } from "lucide-react";
import type { ReactNode } from "react";

type NavItem = {
  to: "/" | "/email" | "/notes" | "/planner";
  label: string;
  code: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { to: "/", label: "Command Deck", code: "00", icon: LayoutDashboard, exact: true },
  { to: "/email", label: "Comms Array", code: "01", icon: Mail },
  { to: "/notes", label: "Signal Decoder", code: "02", icon: FileText },
  { to: "/planner", label: "Flight Plan", code: "03", icon: Calendar },
];

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen text-foreground flex relative">
      <div className="starfield" aria-hidden />
      <aside className="w-72 shrink-0 flex flex-col p-6 gap-8 sticky top-0 h-screen z-10 border-r border-border/60 backdrop-blur-xl bg-background/30">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative size-11 rounded-xl grid place-items-center font-display font-bold text-primary-foreground bg-gradient-to-br from-primary to-accent pulse-glow">
            <span className="relative z-10">Æ</span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-semibold tracking-widest">AEON</span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              Orbital Suite v2.6
            </span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1.5">
          <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70 px-3 mb-3 font-mono">
            ⟁ Modules
          </p>
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border",
                  active
                    ? "glass text-foreground border-primary/40 shadow-glow"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/20 hover:border-border",
                ].join(" ")}
              >
                <span className="font-mono text-[10px] text-primary/70 w-5">{item.code}</span>
                <Icon className={`size-4 ${active ? "text-primary" : ""}`} />
                <span className="tracking-wide">{item.label}</span>
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-primary shadow-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="glass rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 text-xs mb-2">
            <Radar className="size-3.5 text-primary animate-pulse" />
            <span className="uppercase tracking-[0.25em] text-[9px] font-mono text-primary">
              Telemetry · Online
            </span>
          </div>
          <p className="text-xs text-foreground/80 leading-snug">
            Neural drafting, signal summarization, and orbital planning powered by Lovable AI.
          </p>
          <Sparkles className="absolute -bottom-2 -right-2 size-16 text-primary/5" />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="p-10 max-w-6xl mx-auto">{children ?? <Outlet />}</div>
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
    <header className="flex justify-between items-end gap-6 mb-10 pb-6 border-b border-border/60">
      <div>
        {code && (
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-primary/80 mb-3 flex items-center gap-2">
            <span className="inline-block size-1.5 rounded-full bg-primary shadow-glow" />
            SECTOR {code}
          </p>
        )}
        <h1 className="font-display text-3xl font-semibold tracking-wide mb-2 bg-gradient-to-r from-foreground via-foreground to-primary/80 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
