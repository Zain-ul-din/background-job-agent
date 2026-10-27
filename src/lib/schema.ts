import z from "zod";

export const classificationSchema = z.object({
  classification: z.enum(["relevant", "not_relevant"]),
  confidence: z.number().min(0).max(1),
  recommendedResume: z
    .enum(["full-stack", "ai-engineering", "frontend-developer"])
    .describe("What is recommended resume to apply for this job?"),
});

export const outReachHandOffsSchema = z.object({
  handoffs: z.array(
    z.object({
      instructions: z.string(),
      acceptanceCriteria: z
        .string()
        .describe("what criteria should meet in order to report back?"),
    }),
  ),
});

export type OutReachHandOffSchema = z.infer<typeof outReachHandOffsSchema>;
export type ClassificationSchema = z.infer<typeof classificationSchema>;
