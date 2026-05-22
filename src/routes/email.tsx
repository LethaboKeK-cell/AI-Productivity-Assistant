import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Loader2, Send, Sparkles, Wand2 } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button, Card, Pill } from "@/components/ui-kit";
import { generateEmail } from "@/lib/ai.functions";
import { localEmail } from "@/lib/local-ai";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/email")({
  component: EmailPage,
  head: () => ({
    meta: [
      { title: "Smart Email Generator — Aeon AI" },
      {
        name: "description",
        content:
          "Generate context-aware professional emails with tone and audience controls.",
      },
    ],
  }),
});

type Tone = "formal" | "informal" | "persuasive" | "urgent" | "friendly";
type Audience = "client" | "manager" | "team" | "investor" | "vendor";

const tones: Tone[] = ["formal", "informal", "persuasive", "urgent", "friendly"];
const audiences: Audience[] = ["client", "manager", "team", "investor", "vendor"];

function EmailPage() {
  const generate = useServerFn(generateEmail);
  const preferences = useStore((s) => s.preferences);
  const latestSummary = useStore((s) => s.summaries[0]);

  const [context, setContext] = useState("");
  const [recipient, setRecipient] = useState("");
  const [audience, setAudience] = useState<Audience>(preferences.defaultAudience);
  const [tone, setTone] = useState<Tone>(preferences.toneByAudience[preferences.defaultAudience]);
  const [toneOverridden, setToneOverridden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<{
    subject: string;
    greeting: string;
    body: string;
    signoff: string;
  } | null>(null);

  const drafts = useStore((s) => s.drafts);

  // Personalization: apply tone default when audience changes (unless user overrode)
  useEffect(() => {
    if (!toneOverridden) {
      setTone(preferences.toneByAudience[audience]);
    }
  }, [audience, preferences.toneByAudience, toneOverridden]);

  // Context awareness: prefill from latest summary on first mount
  useEffect(() => {
    if (preferences.contextAware && latestSummary && !context) {
      setContext(
        `Follow up on "${latestSummary.title}". Summary: ${latestSummary.summary}`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pullFromLatestMeeting() {
    if (!latestSummary) return;
    setContext(
      `Follow up on "${latestSummary.title}". Summary: ${latestSummary.summary}\n\nKey decisions:\n${latestSummary.decisions.map((d) => `- ${d}`).join("\n")}`,
    );
  }

  async function onGenerate() {
    if (!context.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res =
        preferences.privacyMode === "local"
          ? localEmail({ context: context.trim(), tone, audience, recipientName: recipient || undefined })
          : await generate({
              data: { context: context.trim(), tone, audience, recipientName: recipient || undefined },
            });
      const withSig = preferences.signature
        ? { ...res, signoff: `${res.signoff}\n${preferences.signature}` }
        : res;
      setOutput(withSig);
      store.addDraft({ ...withSig, tone, audience });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  const fullEmail = output
    ? `Subject: ${output.subject}\n\n${output.greeting}\n\n${output.body}\n\n${output.signoff}`
    : "";

  function exportMailto() {
    if (!output) return;
    const url = `mailto:?subject=${encodeURIComponent(output.subject)}&body=${encodeURIComponent(
      `${output.greeting}\n\n${output.body}\n\n${output.signoff}`,
    )}`;
    window.location.href = url;
  }

  function exportGmail() {
    if (!output) return;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
      output.subject,
    )}&body=${encodeURIComponent(`${output.greeting}\n\n${output.body}\n\n${output.signoff}`)}`;
    window.open(url, "_blank");
  }

  function exportOutlook() {
    if (!output) return;
    const url = `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(
      output.subject,
    )}&body=${encodeURIComponent(`${output.greeting}\n\n${output.body}\n\n${output.signoff}`)}`;
    window.open(url, "_blank");
  }

  return (
    <AppLayout>
      <PageHeader
        title="Smart Email Generator"
        description="Describe the situation. Pick a tone and audience. Get a ready-to-send draft."
        actions={
          preferences.contextAware && latestSummary ? (
            <Button variant="outline" size="md" onClick={pullFromLatestMeeting}>
              <Sparkles className="size-4" /> Pull from latest meeting
            </Button>
          ) : undefined
        }
      />


      <div className="grid grid-cols-12 gap-6">
        <Card
          className="col-span-12 lg:col-span-7"
          title="Compose"
          badge={<Pill tone="primary">Active</Pill>}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Recipient (optional)">
                <input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Marcus Chen"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </Field>
              <Field label="Audience">
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value as Audience)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary capitalize"
                >
                  {audiences.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Context / what should the email accomplish">
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Ask the manager for a 48-hour extension on Project Alpha due to late API documentation from the vendor team..."
                className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary h-32 resize-none"
              />
            </Field>

            <Field label={`Tone${toneOverridden ? " (overridden)" : ` · default for ${audience}`}`}>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTone(t);
                      setToneOverridden(true);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md border capitalize transition-colors ${
                      tone === t
                        ? "bg-accent border-primary/40 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
                {toneOverridden && (
                  <button
                    onClick={() => {
                      setToneOverridden(false);
                      setTone(preferences.toneByAudience[audience]);
                    }}
                    className="px-3 py-1.5 text-xs rounded-md border border-dashed border-border text-muted-foreground hover:text-foreground"
                  >
                    reset
                  </button>
                )}
              </div>
            </Field>


            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                {context.length}/4000 characters
              </p>
              <Button onClick={onGenerate} disabled={loading || !context.trim()} variant="secondary">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Drafting…
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4" /> Draft Email
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

        <Card
          className="col-span-12 lg:col-span-5"
          title="Generated Draft"
          actions={
            output && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(fullEmail)}
                >
                  <Copy className="size-3.5" /> Copy
                </Button>
                {preferences.integrations.gmail && (
                  <Button size="sm" variant="outline" onClick={exportGmail}>
                    <ExternalLink className="size-3.5" /> Gmail
                  </Button>
                )}
                {preferences.integrations.outlook && (
                  <Button size="sm" variant="outline" onClick={exportOutlook}>
                    <ExternalLink className="size-3.5" /> Outlook
                  </Button>
                )}
                <Button size="sm" variant="primary" onClick={exportMailto}>
                  <Send className="size-3.5" /> Open in Mail
                </Button>
              </>
            )
          }
        >
          {!output && (
            <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
              Your draft will appear here.
            </div>
          )}
          {output && (
            <article className="space-y-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                  Subject
                </p>
                <p className="text-base font-semibold leading-snug">{output.subject}</p>
              </div>
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-sm">{output.greeting}</p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                  {output.body}
                </p>
                <p className="text-sm whitespace-pre-wrap">{output.signoff}</p>
              </div>
            </article>
          )}
        </Card>
      </div>

      {drafts.length > 1 && (
        <div className="mt-8">
          <Card title={`Recent Drafts (${drafts.length})`}>
            <ul className="divide-y divide-border -my-3">
              {drafts.slice(0, 6).map((d) => (
                <li key={d.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.subject}</p>
                    <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                      {d.tone} · {d.audience}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setOutput({
                        subject: d.subject,
                        greeting: d.greeting,
                        body: d.body,
                        signoff: d.signoff,
                      })
                    }
                  >
                    View
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
