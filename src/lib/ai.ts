import { mistral } from "@ai-sdk/mistral";
import { generateText, Output } from "ai";
import type { JobPost } from "./types";

import { encode } from "@toon-format/toon";
import z from "zod";
import { extractUrls, extractEmails } from "./utils/parsers";
import { sendEmail } from "../services/email-service";
import { loadTemplate } from "./load-template";

const classificationSchema = z.object({
  classification: z.enum(["relevant", "not_relevant"]),
  confidence: z.number().min(0).max(1),
  recommendedResume: z
    .enum(["full-stack", "ai-engineering", "frontend-developer"])
    .describe("What is recommended resume to apply for this job?"),
});

type ClassificationSchema = z.infer<typeof classificationSchema>;

const roles: Record<ClassificationSchema["recommendedResume"], string> = {
  "ai-engineering": "AI Engineering",
  "full-stack": "Full Stack Developer",
  "frontend-developer": "Frontend Developer",
};

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

export async function applyForJobPost(
  post: JobPost,
  classification: ClassificationSchema,
) {
  const emails = extractEmails(post.post);
  const urls = extractUrls(post.post);
  const resumeClassification = classification.recommendedResume;

  if (emails.length > 0) {
    const promises = await Promise.allSettled(
      emails.map(async (email) => {
        await sendEmail({
          to: email,
          subject: `Application for ${roles[resumeClassification]}`,
          text: loadTemplate({ role: roles[resumeClassification] }),
        });
      }),
    );

    console.log(JSON.stringify(promises));
  }

  if (urls.length > 0) {
    // We'll figure out this
  }
}
