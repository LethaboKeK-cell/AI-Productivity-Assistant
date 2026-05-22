import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowRight, Brain, Copy, Loader2, Wand2 } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button, Card, Pill } from "@/components/ui-kit";
import { summarizeNotes } from "@/lib/ai.functions";
import { localSummarize } from "@/lib/local-ai";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/notes")({
  component: NotesPage,
  head: () => ({
    meta: [
      { title: "Meeting Notes Summarizer — Aeon AI" },
      {
        name: "description",
        content:
          "Turn raw meeting notes into structured summaries with key points, decisions, and action items.",
      },
    ],
  }),
});

type Summary = {
  title: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: { task: string; owner: string; deadline: string; priority: "high" | "medium" | "low" }[];
};

const SAMPLE = `[10:02] Discussed Q4 roadmap. Sarah notes mobile latency is still 400ms. Goal is 150ms.
[10:15] Budget approved for 2 new hires in engineering. Hiring starts Monday.
[10:31] Kevin to update API documentation by Friday.
[10:45] Client demo scheduled for Friday 3pm with North Star Group. Marcus owns the prep.
[10:58] Decided to defer mobile redesign to Q1 2026.`;

function NotesPage() {
  const summarize = useServerFn(summarizeNotes);
  const navigate = useNavigate();
  const privacyMode = useStore((s) => s.preferences.privacyMode);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<Summary | null>(null);
  const summaries = useStore((s) => s.summaries);

  async function onSummarize() {
    if (notes.trim().length < 10) return;
    setLoading(true);
    setError(null);
    try {
      const res =
        privacyMode === "local"
          ? localSummarize(notes.trim())
          : await summarize({ data: { notes: notes.trim() } });
      setOutput(res);
      store.addSummary(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Summarization failed");
    } finally {
      setLoading(false);
    }
  }

  function sendToPlanner() {
    if (!output) return;
    store.pushActionItemsFromSummary(output.actionItems);
    navigate({ to: "/planner" });
  }

  return (
    <AppLayout>
      <PageHeader
        title="Notes Summarizer"
        description="Paste raw meeting notes. Get a structured summary with decisions and action items routed to your planner."
        actions={
          <Button variant="outline" size="md" onClick={() => setNotes(SAMPLE)}>
            Load sample
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-5" title="Raw Notes">
          <div className="space-y-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste your raw meeting notes here…"
              className="w-full bg-background border border-border rounded-lg p-3 text-sm font-mono leading-relaxed focus:outline-none focus:ring-1 focus:ring-primary h-80 resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{notes.length} chars</p>
              <Button
                onClick={onSummarize}
                disabled={loading || notes.trim().length < 10}
                variant="secondary"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Synthesizing…
                  </>
                ) : (
                  <>
                    <Brain className="size-4" /> Summarize
                  </>
                )}
              </Button>
            </div>
            {error && (
              <p className="text-xs text-destructive border border-destructive/30 bg-destructive/10 rounded-md p-3">
                {error}
              </p>
            )}
          </div>
        </Card>

        <div className="col-span-12 lg:col-span-7 space-y-6">
          {!output && (
            <Card title="Summary">
              <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                Your structured summary will appear here.
              </div>
            </Card>
          )}

          {output && (
            <>
              <Card
                title={output.title}
                badge={<Pill tone="success">Synthesized</Pill>}
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${output.title}\n\n${output.summary}\n\nKey points:\n${output.keyPoints
                          .map((k) => `• ${k}`)
                          .join("\n")}\n\nDecisions:\n${output.decisions.map((d) => `• ${d}`).join("\n")}`,
                      )
                    }
                  >
                    <Copy className="size-3.5" /> Copy
                  </Button>
                }
              >
                <p className="text-sm text-foreground/90 leading-relaxed mb-6">{output.summary}</p>

                <Section title="Key Points">
                  <ul className="space-y-2">
                    {output.keyPoints.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="size-1.5 rounded-full bg-primary mt-2 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </Section>

                <Section title="Decisions">
                  <ul className="space-y-2">
                    {output.decisions.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="size-1.5 rounded-full bg-success mt-2 shrink-0" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              </Card>

              <Card
                title="Action Items"
                badge={<Pill tone="warning">{output.actionItems.length}</Pill>}
                actions={
                  <Button size="sm" variant="primary" onClick={sendToPlanner}>
                    <Wand2 className="size-3.5" /> Send to Planner <ArrowRight className="size-3.5" />
                  </Button>
                }
              >
                <ul className="divide-y divide-border -my-3">
                  {output.actionItems.map((a, i) => (
                    <li key={i} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{a.task}</p>
                        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">
                          {a.owner} · {a.deadline}
                        </p>
                      </div>
                      <Pill
                        tone={
                          a.priority === "high"
                            ? "warning"
                            : a.priority === "medium"
                              ? "primary"
                              : "muted"
                        }
                      >
                        {a.priority}
                      </Pill>
                    </li>
                  ))}
                </ul>
              </Card>
            </>
          )}
        </div>
      </div>

      {summaries.length > 0 && (
        <div className="mt-8">
          <Card title={`Past Summaries (${summaries.length})`}>
            <ul className="divide-y divide-border -my-3">
              {summaries.slice(0, 5).map((s) => (
                <li key={s.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.summary}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest shrink-0">
                    {s.actionItems.length} actions
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
