import { Router } from "express";
import { inngest } from "../ingest";
import { randomUUID } from "node:crypto";

const processRoute = Router();

processRoute.post("/", async (req, res) => {
  const body = req.body;

  const id = body.id ?? randomUUID();

  await inngest.send({
    id: `job-post-${id}`,
    name: "agent/job.process",
    data: {
      id: randomUUID(),
      post: body.post,
    },
  });

  res.status(200).json({
    success: true,
  });
});

export { processRoute };
