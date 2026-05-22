import { useSyncExternalStore } from "react";

export type ActionItem = {
  id: string;
  task: string;
  owner: string;
  deadline: string;
  priority: "high" | "medium" | "low";
  source: "meeting" | "manual";
  createdAt: number;
};

export type MeetingSummary = {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  decisions: string[];
  actionItems: Omit<ActionItem, "id" | "source" | "createdAt">[];
  createdAt: number;
};

export type EmailDraft = {
  id: string;
  subject: string;
  greeting: string;
  body: string;
  signoff: string;
  tone: string;
  audience: string;
  createdAt: number;
};

export type Audience = "client" | "manager" | "team" | "investor" | "vendor";
export type Tone = "formal" | "informal" | "persuasive" | "urgent" | "friendly";
export type ThemeVariant = "moss" | "fern" | "ember";
export type PrivacyMode = "cloud" | "local" | "encrypted";

export type Preferences = {
  contextAware: boolean;
  toneByAudience: Record<Audience, Tone>;
  defaultAudience: Audience;
  signature: string;
  integrations: {
    google_calendar: boolean;
    outlook: boolean;
    gmail: boolean;
    trello: boolean;
    asana: boolean;
  };
  themeVariant: ThemeVariant;
  privacyMode: PrivacyMode;
};

type State = {
  actionItems: ActionItem[];
  summaries: MeetingSummary[];
  drafts: EmailDraft[];
  preferences: Preferences;
};

const KEY = "aeon-ai-suite-v3";
const ENC_KEY = "aeon-ai-suite-v3-enc";
const isBrowser = typeof window !== "undefined";

const defaultPreferences: Preferences = {
  contextAware: true,
  toneByAudience: {
    client: "formal",
    manager: "formal",
    team: "informal",
    investor: "persuasive",
    vendor: "formal",
  },
  defaultAudience: "manager",
  signature: "",
  integrations: {
    google_calendar: false,
    outlook: false,
    gmail: false,
    trello: false,
    asana: false,
  },
  themeVariant: "moss",
  privacyMode: "cloud",
};

const initial: State = {
  actionItems: [],
  summaries: [],
  drafts: [],
  preferences: defaultPreferences,
};

/* ---------- Encryption (AES-GCM via Web Crypto) ---------- */

let cryptoKey: CryptoKey | null = null;

async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("aeon-suite-salt-v3"),
      iterations: 120_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptJson(data: unknown, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  const out = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(ciphertext), iv.byteLength);
  let bin = "";
  out.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

async function decryptJson(payload: string, key: CryptoKey): Promise<unknown> {
  const bin = atob(payload);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const iv = buf.slice(0, 12);
  const ciphertext = buf.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return JSON.parse(new TextDecoder().decode(plain));
}

/* ---------- State load/save ---------- */

function mergePrefs(parsed: Partial<State> | null | undefined): State {
  if (!parsed) return initial;
  return {
    ...initial,
    ...parsed,
    preferences: {
      ...defaultPreferences,
      ...(parsed.preferences ?? {}),
      toneByAudience: {
        ...defaultPreferences.toneByAudience,
        ...(parsed.preferences?.toneByAudience ?? {}),
      },
      integrations: {
        ...defaultPreferences.integrations,
        ...(parsed.preferences?.integrations ?? {}),
      },
    },
  };
}

function load(): State {
  if (!isBrowser) return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    return mergePrefs(JSON.parse(raw));
  } catch {
    return initial;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function applyTheme(variant: ThemeVariant) {
  if (!isBrowser) return;
  document.documentElement.setAttribute("data-theme", variant);
}
if (isBrowser) applyTheme(state.preferences.themeVariant);

function persist() {
  if (!isBrowser) return;
  const mode = state.preferences.privacyMode;
  if (mode === "encrypted" && cryptoKey) {
    // Async encrypt; remove cleartext immediately
    window.localStorage.removeItem(KEY);
    void encryptJson(state, cryptoKey).then((cipher) => {
      window.localStorage.setItem(ENC_KEY, cipher);
    });
  } else if (mode === "encrypted" && !cryptoKey) {
    // Locked — keep in memory only; clear plaintext to be safe
    window.localStorage.removeItem(KEY);
  } else {
    window.localStorage.removeItem(ENC_KEY);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
}

function emit() {
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => initial;

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(getServerSnapshot()),
  );
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const store = {
  addSummary(s: Omit<MeetingSummary, "id" | "createdAt">) {
    const summary: MeetingSummary = { ...s, id: uid(), createdAt: Date.now() };
    state = { ...state, summaries: [summary, ...state.summaries] };
    emit();
    return summary;
  },
  pushActionItemsFromSummary(items: MeetingSummary["actionItems"]) {
    const newItems: ActionItem[] = items.map((i) => ({
      ...i,
      id: uid(),
      source: "meeting",
      createdAt: Date.now(),
    }));
    state = { ...state, actionItems: [...newItems, ...state.actionItems] };
    emit();
  },
  addManualTask(task: string, priority: ActionItem["priority"], deadline = "No deadline") {
    const item: ActionItem = {
      id: uid(),
      task,
      owner: "Me",
      deadline,
      priority,
      source: "manual",
      createdAt: Date.now(),
    };
    state = { ...state, actionItems: [item, ...state.actionItems] };
    emit();
  },
  removeActionItem(id: string) {
    state = { ...state, actionItems: state.actionItems.filter((i) => i.id !== id) };
    emit();
  },
  addDraft(d: Omit<EmailDraft, "id" | "createdAt">) {
    const draft: EmailDraft = { ...d, id: uid(), createdAt: Date.now() };
    state = { ...state, drafts: [draft, ...state.drafts] };
    emit();
    return draft;
  },
  updatePreferences(patch: Partial<Preferences>) {
    state = {
      ...state,
      preferences: {
        ...state.preferences,
        ...patch,
        toneByAudience: {
          ...state.preferences.toneByAudience,
          ...(patch.toneByAudience ?? {}),
        },
        integrations: {
          ...state.preferences.integrations,
          ...(patch.integrations ?? {}),
        },
      },
    };
    if (patch.themeVariant) applyTheme(patch.themeVariant);
    emit();
  },
  setToneForAudience(audience: Audience, tone: Tone) {
    state = {
      ...state,
      preferences: {
        ...state.preferences,
        toneByAudience: { ...state.preferences.toneByAudience, [audience]: tone },
      },
    };
    emit();
  },
  toggleIntegration(key: keyof Preferences["integrations"], enabled: boolean) {
    state = {
      ...state,
      preferences: {
        ...state.preferences,
        integrations: { ...state.preferences.integrations, [key]: enabled },
      },
    };
    emit();
  },
  /** Set or rotate the encryption passphrase. Re-encrypts existing data. */
  async enableEncryption(passphrase: string) {
    cryptoKey = await deriveKey(passphrase);
    state = {
      ...state,
      preferences: { ...state.preferences, privacyMode: "encrypted" },
    };
    emit();
  },
  /** Unlock encrypted data already in localStorage. */
  async unlockEncryption(passphrase: string): Promise<boolean> {
    if (!isBrowser) return false;
    const cipher = window.localStorage.getItem(ENC_KEY);
    if (!cipher) {
      cryptoKey = await deriveKey(passphrase);
      return true;
    }
    try {
      const key = await deriveKey(passphrase);
      const data = (await decryptJson(cipher, key)) as Partial<State>;
      cryptoKey = key;
      state = mergePrefs(data);
      applyTheme(state.preferences.themeVariant);
      listeners.forEach((l) => l());
      return true;
    } catch {
      return false;
    }
  },
  lockEncryption() {
    cryptoKey = null;
    if (isBrowser) window.localStorage.removeItem(KEY);
  },
  isEncryptionUnlocked() {
    return cryptoKey !== null;
  },
  hasEncryptedPayload() {
    return isBrowser && !!window.localStorage.getItem(ENC_KEY);
  },
  setPrivacyMode(mode: PrivacyMode) {
    if (mode !== "encrypted") cryptoKey = null;
    state = {
      ...state,
      preferences: { ...state.preferences, privacyMode: mode },
    };
    if (isBrowser && mode !== "encrypted") {
      window.localStorage.removeItem(ENC_KEY);
    }
    emit();
  },
  clear() {
    state = initial;
    if (isBrowser) {
      window.localStorage.removeItem(KEY);
      window.localStorage.removeItem(ENC_KEY);
    }
    cryptoKey = null;
    applyTheme(initial.preferences.themeVariant);
    listeners.forEach((l) => l());
  },
};
