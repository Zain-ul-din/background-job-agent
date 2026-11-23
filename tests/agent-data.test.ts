import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "../src/lib/db";
import {
  emailThreadsTable,
  outReachHandOffsTable,
  runsTable,
} from "../src/lib/db/schema";
import {
  getOrCreateRun,
  reportClassification,
  saveEmailThread,
  saveOutReachHandOff,
} from "../src/lib/agent-data";
import { setupTestDb } from "./helpers/db";

beforeAll(setupTestDb);

describe("agent data layer", () => {
  it("getOrCreateRun is idempotent for the same id", async () => {
    const first = await getOrCreateRun("run-1", { post: "original post" });
    const second = await getOrCreateRun("run-1", { post: "re-delivered post" });

    expect(second.id).toBe(first.id);
    expect(second.post).toBe("original post");
    const rows = await db.select().from(runsTable).where(eq(runsTable.id, "run-1"));
    expect(rows).toHaveLength(1);
  });

  it("stores classification, email thread and handoffs against a run", async () => {
    await getOrCreateRun("run-2", { post: "post" });
    await reportClassification("run-2", {
      classification: "relevant",
      confidence: 0.9,
      recommendedRole: "frontend-engineer",
    });
    await saveEmailThread("run-2", { threadId: "t-1", recipient: "hr@x.com" });
    await saveOutReachHandOff("run-2", {
      instructions: "Connect with the hiring manager on LinkedIn",
      acceptanceCriteria: "Connection request URL",
    });

    const threads = await db
      .select()
      .from(emailThreadsTable)
      .where(eq(emailThreadsTable.run_id, "run-2"));
    const handoffs = await db
      .select()
      .from(outReachHandOffsTable)
      .where(eq(outReachHandOffsTable.run_id, "run-2"));

    expect(threads).toMatchObject([{ thread_id: "t-1", recipient: "hr@x.com" }]);
    expect(handoffs).toMatchObject([{ status: "pending" }]);
  });
});
