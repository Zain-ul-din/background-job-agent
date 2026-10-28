import { generateText, Output } from "ai";
import { encode } from "@toon-format/toon";
import { buildClassificationSchema, outReachHandOffsSchema } from "./schema";
import { InferSelectModel } from "drizzle-orm";
import { rolesTable, runsTable } from "./db/schema";
import type { JobPost } from "./types";
import { db } from "./db";
import { models } from "./models";
import { config } from "../config";

const MODEL = models[config.model];

export async function classifyJobPosting(post: JobPost) {
  const roles = await db.select().from(rolesTable);

  const CLASSIFY_INSTRUCTIONS = `Rate how relevant a job post is for a person skilled in:
${roles.map((role) => `- ${role.name}: ${role.skills}`).join("\n")}
Mark not_relevant when the role demands deep senior expertise outside these areas.`;

  return generateText({
    model: MODEL,
    instructions: CLASSIFY_INSTRUCTIONS,
    output: Output.object({
      schema: buildClassificationSchema(roles.map((role) => role.slug)),
    }),
    prompt: encode(post),
    reasoning: "medium",
  });
}

const HANDOFF_INSTRUCTIONS = `Create outreach tasks that could improve this application. The application email is already sent, skip email tasks.
Rules:
- Only tasks completable within 24h by an agent browsing websites/social platforms
- Keep instructions minimal; the agent also receives the job post as context
- Target decision makers (hiring manager, team lead) over generic HR
- Acceptance criteria must be verifiable evidence (URL, message sent, screenshot), not dependent on the other party replying
- Return an empty array if no task makes sense`;

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
