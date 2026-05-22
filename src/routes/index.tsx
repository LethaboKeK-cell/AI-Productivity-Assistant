import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, FileText, Calendar, Sparkles, CheckCircle2 } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button, Card, Pill } from "@/components/ui-kit";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "Aeon AI — Productivity Suite Dashboard" },
      {
        name: "description",
        content:
          "Unified AI workspace for drafting emails, summarizing meeting notes, and planning your day.",
      },
    ],
  }),
});

function Dashboard() {
  const summaries = useStore((s) => s.summaries);
  const actionItems = useStore((s) => s.actionItems);
  const drafts = useStore((s) => s.drafts);

  const highPriority = actionItems.filter((i) => i.priority === "high").length;

  return (
    <AppLayout>
      <PageHeader
        code="CLEARING · 00"
        title="The Clearing"
        description="A quiet overlook of your fleet of AI tools — letters, journal, and trail map all in reach."
        actions={
          <Link to="/email">
            <Button variant="primary">
              Begin a draft <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 mb-8">
        <StatTile label="Action Items" value={actionItems.length} hint={`${highPriority} high priority`} />
        <StatTile label="Meeting Summaries" value={summaries.length} hint="From AI synthesis" />
        <StatTile label="Email Drafts" value={drafts.length} hint="Ready to export" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <ModuleCard
          to="/email"
          icon={<Mail className="size-5" />}
          title="Smart Email Generator"
          tag="Module 01"
          description="Context-aware professional emails with tone & audience controls. Formal, persuasive, or direct — in seconds."
          colSpan="col-span-12 lg:col-span-7"
        />
        <ModuleCard
          to="/notes"
          icon={<FileText className="size-5" />}
          title="Notes Summarizer"
          tag="Module 02"
          description="Convert lengthy meeting notes into key points, decisions, and action items with deadlines."
          colSpan="col-span-12 lg:col-span-5"
        />
        <ModuleCard
          to="/planner"
          icon={<Calendar className="size-5" />}
          title="AI Task Planner"
          tag="Module 03"
          description="Generate structured daily or weekly plans. Prioritize by urgency × importance. Suggest time-optimization moves."
          colSpan="col-span-12"
        />
      </div>

      {actionItems.length > 0 && (
        <div className="mt-8">
          <Card
            title="Recent Action Items"
            badge={<Pill tone="primary">Live</Pill>}
            actions={
              <Link to="/planner">
                <Button size="sm" variant="outline">
                  Open Planner <ArrowRight className="size-3.5" />
                </Button>
              </Link>
            }
          >
            <ul className="divide-y divide-border -my-3">
              {actionItems.slice(0, 5).map((item) => (
                <li key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="size-4 text-muted-foreground shrink-0" />
                    <p className="text-sm truncate">{item.task}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {item.owner} · {item.deadline}
                    </span>
                    <Pill
                      tone={
                        item.priority === "high"
                          ? "warning"
                          : item.priority === "medium"
                            ? "primary"
                            : "muted"
                      }
                    >
                      {item.priority}
                    </Pill>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {actionItems.length === 0 && (
        <Card className="mt-8">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-lg bg-primary/10 grid place-items-center text-primary">
              <Sparkles className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Your suite is ready.</p>
              <p className="text-xs text-muted-foreground">
                Start by summarizing a meeting — action items will flow directly into the planner.
              </p>
            </div>
            <Link to="/notes">
              <Button variant="primary" size="sm">
                Summarize Notes
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </AppLayout>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="glass glow-border rounded-2xl p-5 relative overflow-hidden scanlines">
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary/80 mb-3 font-mono flex items-center gap-2">
        <span className="size-1 rounded-full bg-primary shadow-glow" />
        {label}
      </p>
      <p className="font-display text-4xl font-semibold tabular-nums bg-gradient-to-b from-foreground to-primary/80 bg-clip-text text-transparent">
        {value.toString().padStart(2, "0")}
      </p>
      <p className="text-xs text-muted-foreground mt-2">{hint}</p>
    </div>
  );
}

function ModuleCard({
  to,
  icon,
  title,
  tag,
  description,
  colSpan,
}: {
  to: "/email" | "/notes" | "/planner";
  icon: React.ReactNode;
  title: string;
  tag: string;
  description: string;
  colSpan: string;
}) {
  return (
    <Link
      to={to}
      className={`${colSpan} group glass glow-border rounded-2xl p-6 relative overflow-hidden scanlines hover:shadow-glow transition-all`}
    >
      <div className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-all" />
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/30 text-primary grid place-items-center shadow-glow">
            {icon}
          </div>
          <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/80">
            {tag}
          </span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
      <h3 className="font-display text-lg font-semibold tracking-wide mb-2 relative">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed relative">{description}</p>
    </Link>
  );
}
