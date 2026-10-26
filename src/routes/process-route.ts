import { Router } from "express";
import { inngest } from "../ingest";

const processRoute = Router();

processRoute.post("/", async (req, res) => {
  const body = req.body;

  await inngest.send({
    id: `job-post-${body.id}`,
    name: "agent/job.process",
    data: {
      post: body.post,
    },
  });

  res.status(200).json({
    success: true,
  });
});

export { processRoute };
