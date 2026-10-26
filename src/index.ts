import "dotenv/config";
import express from "express";
import { processRoute } from "./routes/process-route";
import { healthRoute } from "./routes/health-route";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/process", processRoute);
app.use("/health", healthRoute);

const port = process.env.PORT ?? 3010;
app.listen(port, () => {
  console.log(`server is running at localhost:${port}`);
});
