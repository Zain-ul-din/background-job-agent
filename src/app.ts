import express from "express";
import { serve } from "inngest/express";
import { processRoute } from "./routes/process-route";
import { healthRoute } from "./routes/health-route";
import { googleAuthRoute } from "./routes/google-auth-route";
import { rolesRoute } from "./routes/roles-route";
import { functions, inngest } from "./ingest";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static("public"));

  app.use("/process", processRoute);
  app.use("/auth/google", googleAuthRoute);
  app.use("/roles", rolesRoute);
  app.use("/health", healthRoute);

  app.use("/api/inngest", serve({ client: inngest, functions }));

  return app;
}
