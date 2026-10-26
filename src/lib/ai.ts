import { mistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import type { JobPost } from "./types";

import { encode } from "@toon-format/toon";
import { classificationSchema } from "./schema";

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
    reasoning: "low",
  });

  return response;
}
