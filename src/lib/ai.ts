import { generateText, Output } from "ai";
import { encode } from "@toon-format/toon";
import { ClassificationSchema, outReachHandOffsSchema } from "./schema";
import { InferSelectModel } from "drizzle-orm";
import { rolesTable, runsTable } from "./db/schema";
import type { JobPost } from "./types";
import { db } from "./db";
import { decisionModels, models } from "./models";
import { config } from "../config";

import { experimental_decide as decide } from "ai";

const MODEL = models[config.model];
const DECISION_MODEL = decisionModels[config.decisionModel];

export async function classifyJobPosting(
  post: JobPost,
): Promise<ClassificationSchema> {
  const roles = await db.select().from(rolesTable);
  const input = `Rate how relevant a job post is for a person skilled in:\n${encode(post)}`;
  const isSingleRole = roles.length <= 1;

  const decision = await decide({
    model: DECISION_MODEL,
    state: input,
    questions: {
      classification: {
        type: "choice",
        criteria: { relevant: "Relevant", not_relevant: "Not Relevant" },
        instructions:
          "Mark not_relevant when the role demands deep senior expertise outside these areas.",
      },
      ...(isSingleRole
        ? {}
        : {
            recommendedRole: {
              type: "choice",
              instructions: "Recommended role for the job post",
              criteria: Object.fromEntries(
                roles.map((role) => [role.slug, role.name]),
              ),
            },
          }),
    },
  });

  const classification = decision.answers["classification"].choice;
  const classProps = decision.answers["classification"].probabilities;

  const recommendedRole =
    decision.answers["recommendedRole"] &&
    decision.answers["recommendedRole"].type === "choice"
      ? decision.answers["recommendedRole"].choice
      : roles[0].slug;

  return {
    classification,
    confidence: classProps ? classProps[classification] : 0,
    recommendedRole,
  };
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
