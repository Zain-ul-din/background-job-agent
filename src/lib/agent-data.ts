import { eq } from "drizzle-orm";
import { db } from "./db/db";
import {
  emailThreadsTable,
  jobPostClassificationsTable,
  outReachHandOffsTable,
  runsTable,
} from "./db/schema";
import { ClassificationSchema, OutReachHandOffSchema } from "./schema";
import { randomUUID } from "node:crypto";

export async function getOrCreateRun(
  runId: string,
  newRun: {
    post: string;
  },
) {
  const [run] = await db
    .select()
    .from(runsTable)
    .where(eq(runsTable.id, runId))
    .limit(1);

  if (Boolean(run)) return run;

  const newlyCreatedRun = await db
    .insert(runsTable)
    .values({
      id: runId,
      post: newRun.post,
      posted_at: Date.now(),
    })
    .returning();

  return newlyCreatedRun[0];
}

export async function reportClassification(
  runId: string,
  classification: ClassificationSchema,
) {
  const res = await db.insert(jobPostClassificationsTable).values({
    run_id: runId,
    classification: classification.classification,
    confidence: classification.confidence,
    recommendedResume: classification.recommendedResume,
  });

  return res;
}

export async function saveEmailThread(
  runId: string,
  {
    threadId,
    recipient,
  }: {
    threadId: string;
    recipient: string;
  },
) {
  return await db.insert(emailThreadsTable).values({
    run_id: runId,
    thread_id: threadId,
    recipient,
  });
}

export async function saveOutReachHandOff(
  handoff: OutReachHandOffSchema["handoffs"][number],
) {
  return await db.insert(outReachHandOffsTable).values({
    id: randomUUID(),
    instructions: handoff.instructions,
    acceptance_criteria: handoff.acceptanceCriteria,
  });
}
