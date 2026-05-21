import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const MODEL_ID = "google/gemini-3-flash-preview";

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY is not configured");
  return createLovableAiGatewayProvider(key)(MODEL_ID);
}

/* ---------- Smart Email Generator ---------- */
const emailInput = z.object({
  context: z.string().min(1).max(4000),
  tone: z.enum(["formal", "informal", "persuasive", "urgent", "friendly"]),
  audience: z.enum(["client", "manager", "team", "investor", "vendor"]),
  recipientName: z.string().max(120).optional(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => emailInput.parse(data))
  .handler(async ({ data }) => {
    const model = getModel();
    const { context, tone, audience, recipientName } = data;
    const system =
      "You are an expert business writer. Produce a single, ready-to-send professional email. Avoid placeholders like [name] when a name is given. Keep it concise but complete.";
    const prompt = `Write an email with the following parameters:
- Tone: ${tone}
- Audience: ${audience}
- Recipient: ${recipientName || "(unspecified)"}
- Context / goal of the email:
"""
${context}
"""

Return a JSON object with: subject (string), greeting (string, e.g. "Hi Sarah,"), body (string, multi-paragraph, separated by blank lines), signoff (string, e.g. "Best regards,").`;

    const { experimental_output } = await generateText({
      model,
      system,
      prompt,
      experimental_output: Output.object({
        schema: z.object({
          subject: z.string(),
          greeting: z.string(),
          body: z.string(),
          signoff: z.string(),
        }),
      }),
    });
    return experimental_output;
  });

/* ---------- Meeting Notes Summarizer ---------- */
const summaryInput = z.object({
  notes: z.string().min(10).max(20000),
});

export const summarizeNotes = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => summaryInput.parse(data))
  .handler(async ({ data }) => {
    const model = getModel();
    const { experimental_output } = await generateText({
      model,
      system:
        "You are a precise meeting analyst. Extract structured information from raw meeting notes.",
      prompt: `Analyze these meeting notes and return structured output.

Meeting notes:
"""
${data.notes}
"""

Produce:
- title: short descriptive title for the meeting (max 8 words)
- summary: 2-3 sentence executive summary
- keyPoints: array of key discussion points (max 6)
- decisions: array of decisions made (each a single sentence)
- actionItems: array of action items, each with { task, owner (or "Unassigned"), deadline (ISO-ish string like "Friday" or "2025-06-15", or "No deadline"), priority ("high" | "medium" | "low") }`,
      experimental_output: Output.object({
        schema: z.object({
          title: z.string(),
          summary: z.string(),
          keyPoints: z.array(z.string()),
          decisions: z.array(z.string()),
          actionItems: z.array(
            z.object({
              task: z.string(),
              owner: z.string(),
              deadline: z.string(),
              priority: z.enum(["high", "medium", "low"]),
            }),
          ),
        }),
      }),
    });
    return experimental_output;
  });

/* ---------- AI Task Planner ---------- */
const plannerInput = z.object({
  range: z.enum(["day", "week"]),
  tasks: z
    .array(
      z.object({
        task: z.string().min(1).max(500),
        deadline: z.string().max(120).optional(),
        priority: z.enum(["high", "medium", "low"]).optional(),
      }),
    )
    .min(1)
    .max(40),
  context: z.string().max(2000).optional(),
});

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => plannerInput.parse(data))
  .handler(async ({ data }) => {
    const model = getModel();
    const { experimental_output } = await generateText({
      model,
      system:
        "You are a productivity strategist. Build a realistic, prioritized schedule that protects deep work. Use Eisenhower-style urgency/importance reasoning.",
      prompt: `Build a ${data.range} plan.

User context: ${data.context || "(none)"}

Tasks (raw):
${JSON.stringify(data.tasks, null, 2)}

Return:
- overview: 1-2 sentence summary of the plan strategy
- blocks: ordered array. Each block: { day (e.g. "Monday" or "Today"), start (HH:mm), end (HH:mm), task (string), priority ("high"|"medium"|"low"), rationale (1 short sentence) }
- optimizations: array of 2-4 short strategic suggestions to improve focus / time usage

If range is "day", every block.day should be "Today". If "week", spread blocks across Monday–Friday with realistic 30–120 min durations and at least one block per high-priority task.`,
      experimental_output: Output.object({
        schema: z.object({
          overview: z.string(),
          blocks: z.array(
            z.object({
              day: z.string(),
              start: z.string(),
              end: z.string(),
              task: z.string(),
              priority: z.enum(["high", "medium", "low"]),
              rationale: z.string(),
            }),
          ),
          optimizations: z.array(z.string()),
        }),
      }),
    });
    return experimental_output;
  });
