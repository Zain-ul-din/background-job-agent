import { mistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import type { JobPost } from "./types";

import { encode } from "@toon-format/toon";
import { classificationSchema, outReachHandOffsSchema } from "./schema";

import { InferSelectModel } from "drizzle-orm";
import { runsTable } from "./db/schema";

export async function classifyJobPosting(post: JobPost) {
  const instructions = `Classify the relevance of the job posting to help developer apply, with following skills:
Domains: Full Stack developer, Frontend Developer, AI Engineering
Technologies (High level overview): 
  - Frontend: HTML & CSS, React, Next.JS, and Tailwind CSS, Shadcn UI, and including popular libraries 
  - Backend: NodeJS, Python Basics like FastAPI, Ingest, and including popular related technologies.
  - AI Engineering: AI SDK, Lang Chain, Evals, RAG, Observability and fine tuning.
Assumptions: Assume developer is aware of all the best practices and intricacies goes into development like testing, analytics, design patterns and more.
  `;

  const response = await generateText({
    model: mistral("mistral-small-2603"),
    instructions,
    output: Output.object({
      schema: classificationSchema,
    }),
    prompt: encode(post),
    reasoning: "medium",
  });

  return response;
}

export async function handOffOutReaches(
  run: InferSelectModel<typeof runsTable>,
) {
  const instructions = `You are an Expert consultant help people get Job. Given the Job post, your task is to handoff outreach tasks to a powerful AI Agent, those can increase chances of getting hired. Examples of outreach tasks:
- Connect with decision maker on X company on LinkedIn
- Send DM/PM to X person by visiting X URL

Rules for handoff:
- ASSUME we already applied to job using email, so EMAIL PART IS ALREADY DONE
- Just include minimum instructions assume agent picking up these tasks already have enough context
- There is no hard rule to must create handoffs, if something not makes sense just return empty array
- Don't include handoffs those are not possible within 1 days
  `;

  const prompt = encode({
    post: run.post,
    posted_at: new Date(run.posted_at).toISOString(),
  });

  const response = generateText({
    model: mistral("mistral-small-2603"),
    instructions,
    prompt,
    output: Output.object({
      schema: outReachHandOffsSchema,
    }),
  });

  return response;
}
