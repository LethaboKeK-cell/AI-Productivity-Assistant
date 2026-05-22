import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Clock, Download, Loader2, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button, Card, Pill } from "@/components/ui-kit";
import { planTasks } from "@/lib/ai.functions";
import { localPlan } from "@/lib/local-ai";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/planner")({
  component: PlannerPage,
  head: () => ({
    meta: [
      { title: "AI Task Planner — Aeon AI" },
      {
        name: "description",
        content: "Generate a prioritized daily or weekly plan from your action items.",
      },
    ],
  }),
});

type Plan = {
  overview: string;
  blocks: {
    day: string;
    start: string;
    end: string;
    task: string;
    priority: "high" | "medium" | "low";
    rationale: string;
  }[];
  optimizations: string[];
};

function PlannerPage() {
  const plan = useServerFn(planTasks);
  const actionItems = useStore((s) => s.actionItems);
  const preferences = useStore((s) => s.preferences);

  const [range, setRange] = useState<"day" | "week">("day");
  const [context, setContext] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<Plan | null>(null);

  function exportTasksCsv(target: "trello" | "asana") {
    if (actionItems.length === 0) return;
    const header =
      target === "trello"
        ? ["Card Name", "Card Description", "Due Date", "Labels"]
        : ["Name", "Notes", "Due Date", "Priority"];
    const rows = actionItems.map((i) => [
      i.task,
      `Owner: ${i.owner} · Source: ${i.source}`,
      i.deadline,
      i.priority,
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aeon-tasks-${target}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }


  async function onGenerate() {
    if (actionItems.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const tasks = actionItems.map((i) => ({
        task: i.task,
        deadline: i.deadline,
        priority: i.priority,
      }));
      const res =
        preferences.privacyMode === "local"
          ? localPlan({ range, context: context || undefined, tasks })
          : await plan({
              data: {
                range,
                context: context || undefined,
                tasks,
              },
            });
      setOutput(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Planning failed");
    } finally {
      setLoading(false);
    }
  }

  function exportICS() {
    if (!output) return;
    const today = new Date();
    const dayMap: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
    };
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Aeon AI//Planner//EN",
    ];
    output.blocks.forEach((b, idx) => {
      const base = new Date(today);
      const dayKey = b.day.toLowerCase().trim();
      if (dayKey === "today") {
        // base stays today
      } else if (dayKey in dayMap) {
        const target = dayMap[dayKey];
        const diff = (target - today.getDay() + 7) % 7;
        base.setDate(today.getDate() + diff);
      }
      const [sh, sm] = b.start.split(":").map(Number);
      const [eh, em] = b.end.split(":").map(Number);
      const start = new Date(base);
      start.setHours(sh || 9, sm || 0, 0, 0);
      const end = new Date(base);
      end.setHours(eh || 10, em || 0, 0, 0);
      const fmt = (d: Date) =>
        d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      lines.push(
        "BEGIN:VEVENT",
        `UID:aeon-${idx}-${Date.now()}@aeon.ai`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${b.task}`,
        `DESCRIPTION:${b.rationale}`,
        "END:VEVENT",
      );
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aeon-plan-${range}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppLayout>
      <PageHeader
        title="AI Task Planner"
        description="Prioritized scheduling powered by your action items and meeting summaries."
        actions={
          <div className="flex gap-2 flex-wrap justify-end">
            {preferences.integrations.trello && actionItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => exportTasksCsv("trello")}>
                <Download className="size-3.5" /> Trello CSV
              </Button>
            )}
            {preferences.integrations.asana && actionItems.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => exportTasksCsv("asana")}>
                <Download className="size-3.5" /> Asana CSV
              </Button>
            )}
            {output && (
              <Button variant="outline" onClick={exportICS}>
                <Download className="size-4" />{" "}
                {preferences.integrations.google_calendar ? "Google Calendar (.ics)" : "Export .ics"}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <Card
          className="col-span-12 lg:col-span-5"
          title="Inputs"
          badge={<Pill tone="primary">{actionItems.length} tasks</Pill>}
        >
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
                Range
              </label>
              <div className="flex gap-2">
                {(["day", "week"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-4 py-2 rounded-md text-sm capitalize border transition-colors ${
                      range === r
                        ? "bg-accent border-primary/40"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r === "day" ? "Today" : "This Week"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
                Context (optional)
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. Protect mornings for deep work. No meetings before 10am."
                className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none"
              />
            </div>

            <div className="border-t border-border pt-5">
              <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2 block">
                Add task
              </label>
              <div className="flex gap-2">
                <input
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="New task…"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as "high" | "medium" | "low")}
                  className="bg-background border border-border rounded-lg px-2 py-2 text-xs capitalize"
                >
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (!newTask.trim()) return;
                    store.addManualTask(newTask.trim(), newPriority);
                    setNewTask("");
                  }}
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            </div>

            <Button
              onClick={onGenerate}
              disabled={loading || actionItems.length === 0}
              variant="secondary"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Planning…
                </>
              ) : (
                <>
                  <Wand2 className="size-4" /> Generate {range === "day" ? "Daily" : "Weekly"} Plan
                </>
              )}
            </Button>

            {error && (
              <p className="text-xs text-destructive border border-destructive/30 bg-destructive/10 rounded-md p-3">
                {error}
              </p>
            )}
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-7" title={`Tasks (${actionItems.length})`}>
          {actionItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              No tasks yet. Summarize a meeting or add a task to get started.
            </div>
          ) : (
            <ul className="divide-y divide-border -my-3 max-h-96 overflow-y-auto">
              {actionItems.map((i) => (
                <li key={i.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{i.task}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">
                      {i.owner} · {i.deadline} · from {i.source}
                    </p>
                  </div>
                  <Pill
                    tone={
                      i.priority === "high"
                        ? "warning"
                        : i.priority === "medium"
                          ? "primary"
                          : "muted"
                    }
                  >
                    {i.priority}
                  </Pill>
                  <button
                    onClick={() => store.removeActionItem(i.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    aria-label="Remove"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {output && (
          <>
            <Card
              className="col-span-12"
              title={`Generated ${range === "day" ? "Daily" : "Weekly"} Plan`}
              badge={<Pill tone="success">AI Strategy</Pill>}
            >
              <p className="text-sm text-foreground/90 leading-relaxed mb-6 border-l-2 border-primary pl-4 italic">
                {output.overview}
              </p>

              <div className="space-y-2">
                {output.blocks.map((b, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 p-4 rounded-lg border-l-2 bg-background ${
                      b.priority === "high"
                        ? "border-warning"
                        : b.priority === "medium"
                          ? "border-primary"
                          : "border-border"
                    }`}
                  >
                    <div className="w-20 shrink-0">
                      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        {b.day}
                      </p>
                      <p className="text-xs font-mono tabular-nums flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" />
                        {b.start}–{b.end}
                      </p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{b.task}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{b.rationale}</p>
                    </div>
                    <Pill
                      tone={
                        b.priority === "high"
                          ? "warning"
                          : b.priority === "medium"
                            ? "primary"
                            : "muted"
                      }
                    >
                      {b.priority}
                    </Pill>
                  </div>
                ))}
              </div>
            </Card>

            <Card
              className="col-span-12"
              title="Time Optimization Strategies"
              badge={<Pill tone="success">AI</Pill>}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {output.optimizations.map((o, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-4 rounded-lg bg-success/5 border border-success/20"
                  >
                    <Sparkles className="size-4 text-success shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{o}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
