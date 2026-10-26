import z from "zod";

export const classificationSchema = z.object({
  classification: z.enum(["relevant", "not_relevant"]),
  confidence: z.number().min(0).max(1),
  recommendedResume: z
    .enum(["full-stack", "ai-engineering", "frontend-developer"])
    .describe("What is recommended resume to apply for this job?"),
});

export type ClassificationSchema = z.infer<typeof classificationSchema>;
