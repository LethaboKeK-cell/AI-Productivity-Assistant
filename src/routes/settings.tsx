import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Lock, Plug, Shield, Sliders, UserCog, Palette, KeyRound, Unlock } from "lucide-react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button, Card, Pill } from "@/components/ui-kit";
import {
  store,
  useStore,
  type Audience,
  type Tone,
  type Preferences,
  type ThemeVariant,
  type PrivacyMode,
} from "@/lib/store";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Settings — Aeon AI" },
      {
        name: "description",
        content:
          "Personalize tone, theme, privacy, and integration hooks across the Aeon AI productivity suite.",
      },
    ],
  }),
});

const audiences: Audience[] = ["client", "manager", "team", "investor", "vendor"];
const tones: Tone[] = ["formal", "informal", "persuasive", "urgent", "friendly"];

const integrations: { key: keyof Preferences["integrations"]; label: string; hint: string }[] = [
  { key: "google_calendar", label: "Google Calendar", hint: "Push planner blocks as events" },
  { key: "outlook", label: "Microsoft Outlook", hint: "Send drafts to your Outlook inbox" },
  { key: "gmail", label: "Gmail", hint: "Open drafts in Gmail compose" },
  { key: "trello", label: "Trello", hint: "Export action items as cards" },
  { key: "asana", label: "Asana", hint: "Sync tasks to a workspace project" },
];

const themes: { id: ThemeVariant; label: string; hint: string; swatch: string[] }[] = [
  { id: "moss", label: "Moss", hint: "Wet stone, cedar bark, mossy green", swatch: ["#3a5a44", "#6f9e7c", "#a3c8b8"] },
  { id: "fern", label: "Fern", hint: "Spring chartreuse, dewy teal", swatch: ["#4a6b2c", "#9bbf4f", "#7fc6c0"] },
  { id: "ember", label: "Ember", hint: "Autumn rust, lantern amber", swatch: ["#5a3621", "#c8853f", "#e8b372"] },
];

const privacyOptions: { id: PrivacyMode; label: string; hint: string }[] = [
  { id: "cloud", label: "Cloud AI", hint: "Best quality. Sends prompts to Lovable AI Gateway." },
  { id: "local", label: "Local-Only", hint: "On-device drafting. No data leaves your browser." },
  { id: "encrypted", label: "Encrypted Vault", hint: "Cloud AI + AES-256-GCM encrypted local storage." },
];

function SettingsPage() {
  const prefs = useStore((s) => s.preferences);

  return (
    <AppLayout>
      <PageHeader
        code="HOLLOW · 04"
        title="Suite Preferences"
        description="Tune context awareness, theme, privacy posture, and integration hooks."
      />

      <div className="grid grid-cols-12 gap-4 lg:gap-6">
        {/* Theme */}
        <Card
          className="col-span-12 lg:col-span-6"
          title="Forest Palette"
          badge={<Pill tone="primary"><Palette className="size-3 inline mr-1" />{prefs.themeVariant}</Pill>}
        >
          <p className="text-sm mb-4 text-muted-foreground">
            Choose the variation of forest light. Theme applies instantly across every module.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themes.map((t) => {
              const active = prefs.themeVariant === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => store.updatePreferences({ themeVariant: t.id })}
                  className={`text-left p-4 rounded-xl border transition-all ${
                    active ? "border-primary/60 bg-primary/5 shadow-glow" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex gap-1.5 mb-3">
                    {t.swatch.map((c) => (
                      <span key={c} className="size-5 rounded-full ring-1 ring-border" style={{ background: c }} />
                    ))}
                  </div>
                  <p className="text-sm font-medium capitalize flex items-center gap-2">
                    {t.label}
                    {active && <Check className="size-3.5 text-primary" />}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t.hint}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Privacy & Storage */}
        <Card
          className="col-span-12 lg:col-span-6"
          title="Privacy & Storage"
          badge={
            <Pill tone={prefs.privacyMode === "cloud" ? "muted" : "success"}>
              <Shield className="size-3 inline mr-1" />
              {prefs.privacyMode}
            </Pill>
          }
        >
          <div className="space-y-3">
            {privacyOptions.map((p) => {
              const active = prefs.privacyMode === p.id;
              return (
                <label
                  key={p.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    active ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="privacy"
                    checked={active}
                    onChange={() => {
                      if (p.id === "encrypted") {
                        // setting encrypted requires passphrase via the form below
                        store.setPrivacyMode("cloud");
                        return;
                      }
                      store.setPrivacyMode(p.id);
                    }}
                    className="mt-1 accent-[var(--primary)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{p.label}</p>
                    <p className="text-xs text-muted-foreground">{p.hint}</p>
                  </div>
                </label>
              );
            })}
          </div>

          <EncryptionPanel current={prefs.privacyMode} />
        </Card>

        {/* Context */}
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
                Auto-detect context from recent activity. The email module pre-fills from your latest meeting,
                and the planner pulls fresh action items without manual re-entry.
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

        {/* Personalization */}
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
              Default tone per audience. Email composer applies these automatically.
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
                    <option key={t} value={t}>{t}</option>
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
                <option key={a} value={a}>{a}</option>
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

        {/* Integrations */}
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
              Enabled hooks expose extra export buttons across the suite — calendar pushes,
              mailbox handoff, and task-manager exports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {integrations.map((i) => {
              const enabled = prefs.integrations[i.key];
              return (
                <div
                  key={i.key}
                  className={`flex items-center justify-between gap-4 p-4 rounded-lg border transition-colors ${
                    enabled ? "border-primary/40 bg-primary/5" : "border-border bg-background/40"
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

function EncryptionPanel({ current }: { current: PrivacyMode }) {
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const hasPayload = typeof window !== "undefined" && !!window.localStorage.getItem("aeon-ai-suite-v3-enc");
  const unlocked = store.isEncryptionUnlocked();

  async function enable() {
    if (pass.length < 6) {
      setErr("Passphrase must be at least 6 characters.");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await store.enableEncryption(pass);
      setPass("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Encryption failed");
    } finally {
      setBusy(false);
    }
  }

  async function unlock() {
    setBusy(true);
    setErr(null);
    const ok = await store.unlockEncryption(pass);
    setBusy(false);
    if (!ok) setErr("Wrong passphrase.");
    else setPass("");
  }

  return (
    <div className="mt-5 pt-5 border-t border-border/60">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="size-3.5 text-primary" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-primary">Encrypted Vault</p>
      </div>

      {current === "encrypted" && unlocked ? (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-success/40 bg-success/5">
          <p className="text-sm flex items-center gap-2">
            <Unlock className="size-4 text-success" /> Vault unlocked. New writes are encrypted with AES-256-GCM.
          </p>
          <Button size="sm" variant="ghost" onClick={() => { store.lockEncryption(); store.setPrivacyMode("cloud"); }}>
            Disable
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            {hasPayload
              ? "An encrypted vault exists. Enter your passphrase to unlock."
              : "Set a passphrase. Notes, drafts, and tasks will be encrypted at rest with PBKDF2 + AES-GCM."}
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <KeyRound className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Passphrase"
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button
              size="sm"
              variant="primary"
              disabled={busy || !pass}
              onClick={hasPayload ? unlock : enable}
            >
              {hasPayload ? "Unlock" : "Encrypt"}
            </Button>
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
        </div>
      )}
    </div>
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
        checked ? "bg-primary/30 border-primary shadow-glow" : "bg-background border-border"
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
