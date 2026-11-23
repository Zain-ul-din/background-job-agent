import "dotenv/config";
import { createApp } from "./app";
import { initAuth } from "./lib/auth";
import { startSources } from "./ingest/sources";

const app = createApp();

const port = process.env.PORT ?? 3010;
app.listen(port, async () => {
  console.log(`server is running at localhost:${port}`);

  initAuth();
  console.log(
    `\n\x1b[32mSetup your target roles at http://localhost:${port}/roles.html\x1b[0m\n`,
  );
  await startSources();
});
