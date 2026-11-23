import { Router } from "express";
import { randomUUID } from "node:crypto";
import z from "zod";
import { inngest } from "../ingest";

const processBodySchema = z.object({
  post: z.string().trim().min(1, "post is required"),
  id: z.string().trim().min(1).optional(),
});

const processRoute = Router();

processRoute.post("/", async (req, res) => {
  const parsed = processBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: parsed.error.issues.map((issue) => issue.message).join(", "),
    });
  }

  // The caller's id is the run id, so re-submitting the same posting maps to
  // the same run instead of starting a new one (and re-emailing recruiters).
  const id = parsed.data.id ?? randomUUID();

  await inngest.send({
    id: `job-post-${id}`,
    name: "agent/job.process",
    data: {
      id,
      post: parsed.data.post,
    },
  });

  res.status(200).json({ success: true, id });
});

export { processRoute };
