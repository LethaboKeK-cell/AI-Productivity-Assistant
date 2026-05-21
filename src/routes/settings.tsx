import { createFileRoute } from "@tanstack/react-router";
import { Check, Plug, Sliders, UserCog } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card, Pill } from "@/components/ui-kit";
import { store, useStore, type Audience, type Tone, type Preferences } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Aeon AI" },
      {
        name: "description",
        content:
          "Personalize tone defaults, enable context awareness, and configure integration hooks for calendar, email, and task managers.",
      },
    ],
  }),
});

const audiences: Audience[] = ["client", "manager", "team", "investor", "vendor"];
const tones: Tone[] = ["formal", "informal", "persuasive", "urgent", "friendly"];

const integrations: { key: keyof ReturnType<typeof getPrefs>["integrations"]; label: string; hint: string }[] = [
  { key: "google_calendar", label: "Google Calendar", hint: "Push planner blocks as events" },
  { key: "outlook", label: "Microsoft Outlook", hint: "Send drafts to your Outlook inbox" },
  { key: "gmail", label: "Gmail", hint: "Open drafts in Gmail compose" },
  { key: "trello", label: "Trello", hint: "Export action items as cards" },
  { key: "asana", label: "Asana", hint: "Sync tasks to a workspace project" },
];

function getPrefs() {
  return {
    integrations: {} as Record<
      "google_calendar" | "outlook" | "gmail" | "trello" | "asana",
      boolean
    >,
  };
}

function SettingsPage() {
  const prefs = useStore((s) => s.preferences);

  return (
    <AppLayout>
      <PageHeader
        code="04 · CONFIG BAY"
        title="Suite Parameters"
        description="Tune context awareness, personalize tone defaults, and arm integration hooks for downstream systems."
      />

      <div className="grid grid-cols-12 gap-6">
        <Card
          className="col-span-12 lg:col-span-6"
          title="Context Awareness"
          badge={
            <Pill tone={prefs.contextAware ? "success" : "muted"}>
              {prefs.contextAware ? "Armed" : "Off"}
            </Pill>
          }
        >
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center text-primary shrink-0">
              <Sliders className="size-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                Auto-detect context from recent activity. The email module will pre-fill
                from your latest meeting summary, and the planner will pull fresh action items
                without manual re-entry.
              </p>
              <label className="mt-4 inline-flex items-center gap-3 cursor-pointer select-none">
                <Toggle
                  checked={prefs.contextAware}
                  onChange={(v) => store.updatePreferences({ contextAware: v })}
                />
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">
                  contextAware = {String(prefs.contextAware)}
                </span>
              </label>
            </div>
          </div>
        </Card>

        <Card
          className="col-span-12 lg:col-span-6"
          title="Personalization"
          badge={<Pill tone="primary">Tone Defaults</Pill>}
        >
          <div className="flex items-start gap-4 mb-5">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center text-primary shrink-0">
              <UserCog className="size-4" />
            </div>
            <p className="text-sm flex-1">
              Define your preferred default tone for each audience. The email composer
              applies these automatically when you switch audiences.
            </p>
          </div>

          <div className="space-y-2">
            {audiences.map((a) => (
              <div
                key={a}
                className="flex items-center justify-between gap-3 py-2 border-b border-border/40 last:border-0"
              >
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground w-20">
                  {a}
                </span>
                <select
                  value={prefs.toneByAudience[a]}
                  onChange={(e) => store.setToneForAudience(a, e.target.value as Tone)}
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-1.5 text-xs capitalize focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {tones.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-border/60">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-2">
              Default audience
            </label>
            <select
              value={prefs.defaultAudience}
              onChange={(e) =>
                store.updatePreferences({ defaultAudience: e.target.value as Audience })
              }
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm capitalize focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {audiences.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-2">
              Signature
            </label>
            <textarea
              value={prefs.signature}
              onChange={(e) => store.updatePreferences({ signature: e.target.value })}
              placeholder="Best,&#10;Your Name"
              className="w-full bg-background border border-border rounded-lg p-3 text-sm h-20 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </Card>

        <Card
          className="col-span-12"
          title="Integration Hooks"
          badge={
            <Pill tone="success">
              {Object.values(prefs.integrations).filter(Boolean).length} connected
            </Pill>
          }
        >
          <div className="flex items-start gap-4 mb-5">
            <div className="size-10 rounded-lg bg-primary/10 border border-primary/30 grid place-items-center text-primary shrink-0">
              <Plug className="size-4" />
            </div>
            <p className="text-sm flex-1">
              Arm downstream systems. Enabled hooks expose extra export buttons across
              the suite — Calendar pushes for Flight Plan, mailbox handoff for Comms,
              and task-manager exports for action items.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integrations.map((i) => {
              const enabled = prefs.integrations[i.key];
              return (
                <div
                  key={i.key}
                  className={`flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors ${
                    enabled
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-background/40"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium flex items-center gap-2">
                      {i.label}
                      {enabled && <Check className="size-3.5 text-success" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{i.hint}</p>
                  </div>
                  <Toggle
                    checked={enabled}
                    onChange={(v) => store.toggleIntegration(i.key, v)}
                  />
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-all ${
        checked
          ? "bg-primary/30 border-primary shadow-glow"
          : "bg-background border-border"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block size-4 rounded-full bg-foreground transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}
