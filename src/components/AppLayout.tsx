import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Mail, FileText, Calendar, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

type NavItem = {
  to: "/" | "/email" | "/notes" | "/planner";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/email", label: "Email Engine", icon: Mail },
  { to: "/notes", label: "Meeting Notes", icon: FileText },
  { to: "/planner", label: "Task Planner", icon: Calendar },
];

export function AppLayout({ children }: { children?: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <aside className="w-64 shrink-0 border-r border-border flex flex-col p-6 gap-8 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="size-9 rounded-lg bg-primary grid place-items-center font-bold italic text-primary-foreground shadow-glow">
            A
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">Aeon AI</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Productivity Suite
            </span>
          </div>
        </Link>

        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40",
                ].join(" ")}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="rounded-lg border border-border p-3 bg-surface/40">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Sparkles className="size-3.5 text-primary" />
            <span className="uppercase tracking-widest text-[10px]">Powered by</span>
          </div>
          <p className="text-xs text-foreground/90 leading-snug">
            Lovable AI — context-aware drafting, summarization, and planning.
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-10 max-w-6xl mx-auto">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex justify-between items-start gap-6 mb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight mb-1">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-sm max-w-2xl">{description}</p>
        )}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
