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
};

type State = {
  actionItems: ActionItem[];
  summaries: MeetingSummary[];
  drafts: EmailDraft[];
  preferences: Preferences;
};

const KEY = "aeon-ai-suite-v2";
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
};

const initial: State = {
  actionItems: [],
  summaries: [],
  drafts: [],
  preferences: defaultPreferences,
};

function load(): State {
  if (!isBrowser) return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    return { ...initial, ...JSON.parse(raw) };
  } catch {
    return initial;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function emit() {
  if (isBrowser) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }
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
  clear() {
    state = initial;
    emit();
  },
};
