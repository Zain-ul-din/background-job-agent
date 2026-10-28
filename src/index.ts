import "dotenv/config";
import express from "express";
import { processRoute } from "./routes/process-route";
import { healthRoute } from "./routes/health-route";
import { serve } from "inngest/express";
import { functions, inngest } from "./ingest";
import { googleAuthRoute } from "./routes/google-auth-route";
import { rolesRoute } from "./routes/roles-route";
import { initAuth } from "./lib/auth";
import { startSources } from "./ingest/sources";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/process", processRoute);
app.use("/auth/google", googleAuthRoute);
app.use("/roles", rolesRoute);
app.use("/health", healthRoute);

app.use("/api/inngest", serve({ client: inngest, functions: functions }));

const port = process.env.PORT ?? 3010;
app.listen(port, async () => {
  console.log(`server is running at localhost:${port}`);

  initAuth();
  console.log(
    `\n\x1b[32mSetup your target roles at http://localhost:${port}/roles.html\x1b[0m\n`,
  );
  await startSources();
});
