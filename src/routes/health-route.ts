import { Router } from "express";

const healthRoute = Router();

healthRoute.get("/", (_, res) => {
  res.status(200).json({ status: "ok" });
});

export { healthRoute };
