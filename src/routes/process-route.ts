import { Router } from "express";
import { applyForJobPost, classifyJobPosting } from "../lib/ai";

const processRoute = Router();

processRoute.post("/", async (req, res) => {
  const body = req.body;

  const jobPost = {
    post: body.post,
    postedAt: new Date(),
  };

  const response = await classifyJobPosting(jobPost);

  if (response.output.classification === "not_relevant")
    return res.status(201).json({ success: true, stop_reason: "not-relevant" });

  await applyForJobPost(jobPost, response.output);

  res.status(201).json({ success: true, response });
});

export { processRoute };
