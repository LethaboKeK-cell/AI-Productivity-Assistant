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
        title="Workspace Overview"
        description="Automating your workflow across three core AI modules."
        actions={
          <Link to="/email">
            <Button variant="primary">
              New Session <ArrowRight className="size-4" />
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-12 gap-6 mb-8">
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
    <div className="col-span-12 md:col-span-4 bg-surface border border-border rounded-xl p-5 shadow-card">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
        {label}
      </p>
      <p className="text-3xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{hint}</p>
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
      className={`${colSpan} group bg-surface border border-border rounded-xl p-6 shadow-card hover:border-primary/40 hover:shadow-glow transition-all`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-lg bg-accent text-primary grid place-items-center">
            {icon}
          </div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {tag}
          </span>
        </div>
        <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </Link>
  );
}
