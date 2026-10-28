import "dotenv/config";
import express from "express";
import { processRoute } from "./routes/process-route";
import { healthRoute } from "./routes/health-route";
import { serve } from "inngest/express";
import { functions, inngest } from "./ingest";
import { googleAuthRoute } from "./routes/google-auth-route";
import { initAuth } from "./lib/auth";
import { runCLI } from "./cli";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/process", processRoute);
app.use("/auth/google", googleAuthRoute);
app.use("/health", healthRoute);

app.use("/api/inngest", serve({ client: inngest, functions: functions }));

const port = process.env.PORT ?? 3010;
app.listen(port, () => {
  console.log(`server is running at localhost:${port}`);

  initAuth();
  runCLI({
    baseUrl: `http://localhost:${port}`,
  });
});
