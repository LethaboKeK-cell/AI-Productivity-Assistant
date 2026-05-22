// Local-only fallback "AI" — runs entirely in the browser, no network.
// Heuristic templates so the suite stays usable in privacy mode.

export function localEmail(input: {
  context: string;
  tone: string;
  audience: string;
  recipientName?: string;
}) {
  const greet = input.recipientName ? `Hi ${input.recipientName},` : "Hi there,";
  const opener: Record<string, string> = {
    formal: "I hope this message finds you well.",
    informal: "Hope you're having a good week.",
    persuasive: "I'd like to share a quick opportunity I think is worth your attention.",
    urgent: "I'm reaching out on a time-sensitive matter.",
    friendly: "Hope you're doing great!",
  };
  const closer: Record<string, string> = {
    formal: "Best regards,",
    informal: "Cheers,",
    persuasive: "Looking forward to your thoughts,",
    urgent: "Thanks for the quick attention,",
    friendly: "Talk soon,",
  };
  const subjectKeyword = input.context.split(/\s+/).slice(0, 5).join(" ");
  return {
    subject: `Re: ${subjectKeyword}${subjectKeyword.length < input.context.length ? "…" : ""}`,
    greeting: greet,
    body: `${opener[input.tone] ?? opener.formal}\n\n${input.context.trim()}\n\nLet me know if you have any questions or need more detail.`,
    signoff: closer[input.tone] ?? closer.formal,
  };
}

export function localSummarize(notes: string) {
  const lines = notes
    .split(/\n+/)
    .map((l) => l.replace(/^\[?\d{1,2}:\d{2}\]?\s*/, "").trim())
    .filter(Boolean);

  const decisions = lines.filter((l) =>
    /\b(decid|approv|agreed|will not|defer|chosen|going with)\b/i.test(l),
  );
  const actions = lines
    .filter((l) => /\b(will|to |owns|by |due|deadline|action|todo)\b/i.test(l))
    .slice(0, 8)
    .map((l) => {
      const ownerMatch = l.match(/\b([A-Z][a-z]+)\b/);
      const dueMatch = l.match(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|next week|\d{4}-\d{2}-\d{2})\b/i);
      const priority: "high" | "medium" | "low" = /asap|urgent|immediate/i.test(l)
        ? "high"
        : /soon|this week|by friday/i.test(l)
          ? "medium"
          : "low";
      return {
        task: l.replace(/^[-•*]\s*/, ""),
        owner: ownerMatch?.[1] ?? "Unassigned",
        deadline: dueMatch?.[1] ?? "No deadline",
        priority,
      };
    });
  const keyPoints = lines.filter((l) => !decisions.includes(l)).slice(0, 6);

  const firstWords = lines[0]?.split(/\s+/).slice(0, 6).join(" ") ?? "Meeting Notes";
  return {
    title: firstWords.length > 50 ? firstWords.slice(0, 50) + "…" : firstWords,
    summary:
      lines.slice(0, 3).join(" ").slice(0, 280) ||
      "Local summary generated from your notes without sending data to any server.",
    keyPoints,
    decisions,
    actionItems: actions.length
      ? actions
      : [
          {
            task: "Review meeting notes",
            owner: "Me",
            deadline: "No deadline",
            priority: "medium" as const,
          },
        ],
  };
}

export function localPlan(input: {
  range: "day" | "week";
  tasks: { task: string; deadline?: string; priority?: "high" | "medium" | "low" }[];
  context?: string;
}) {
  const order = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...input.tasks].sort(
    (a, b) => order[a.priority ?? "medium"] - order[b.priority ?? "medium"],
  );
  const days = input.range === "day"
    ? ["Today"]
    : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  let h = 9, m = 0;
  const blocks = sorted.map((t, i) => {
    const day = days[i % days.length];
    if (i > 0 && i % days.length === 0) { h = 9; m = 0; }
    const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    const dur = (t.priority === "high" ? 90 : t.priority === "medium" ? 60 : 45);
    m += dur;
    while (m >= 60) { h += 1; m -= 60; }
    if (h >= 17) { h = 9; m = 0; }
    const end = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return {
      day,
      start,
      end,
      task: t.task,
      priority: (t.priority ?? "medium") as "high" | "medium" | "low",
      rationale: t.priority === "high"
        ? "High priority — protected morning focus block."
        : "Scheduled by priority and energy curve.",
    };
  });
  return {
    overview: `Local ${input.range} plan generated on-device. ${sorted.length} task${sorted.length === 1 ? "" : "s"} sequenced by priority.`,
    blocks,
    optimizations: [
      "Batch shallow tasks into a single afternoon block to protect deep-work mornings.",
      "Add a 15-minute buffer between high-priority blocks to absorb overruns.",
      "Defer low-priority items to a weekly review slot.",
    ],
  };
}
