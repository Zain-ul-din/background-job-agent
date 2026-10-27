import { mistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import { encode } from "@toon-format/toon";
import { classificationSchema, outReachHandOffsSchema } from "./schema";
import { InferSelectModel } from "drizzle-orm";
import { runsTable } from "./db/schema";
import type { JobPost } from "./types";

const MODEL = mistral("mistral-small-2603");

const CLASSIFY_INSTRUCTIONS = `Rate how relevant a job post is for a developer skilled in:
- Frontend: HTML/CSS, React, Next.js, Tailwind, shadcn/ui, common libraries
- Backend: Node.js, Python/FastAPI, Inngest, related tech
- AI Engineering: AI SDK, LangChain, RAG, evals, observability, fine-tuning
Assume they follow best practices (testing, analytics, design patterns).
Mark not_relevant when the role demands deep senior expertise outside these areas.`;

const HANDOFF_INSTRUCTIONS = `Create outreach tasks that could improve this application. The application email is already sent, skip email tasks.
Rules:
- Only tasks completable within 24h by an agent browsing websites/social platforms
- Keep instructions minimal; the agent also receives the job post as context
- Target decision makers (hiring manager, team lead) over generic HR
- Acceptance criteria must be verifiable evidence (URL, message sent, screenshot), not dependent on the other party replying
- Return an empty array if no task makes sense`;

export async function classifyJobPosting(post: JobPost) {
  return generateText({
    model: MODEL,
    instructions: CLASSIFY_INSTRUCTIONS,
    output: Output.object({ schema: classificationSchema }),
    prompt: encode(post),
    reasoning: "medium",
  });
}

export async function handOffOutReaches(
  run: InferSelectModel<typeof runsTable>,
) {
  return generateText({
    model: MODEL,
    instructions: HANDOFF_INSTRUCTIONS,
    output: Output.object({ schema: outReachHandOffsSchema }),
    prompt: encode({
      post: run.post,
      posted_at: new Date(run.posted_at).toISOString(),
    }),
  });
}
