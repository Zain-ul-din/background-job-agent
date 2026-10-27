import { Inngest } from "inngest";
import { classifyJobPosting, handOffOutReaches } from "../lib/ai";
import { extractEmails } from "../lib/utils/parsers";
import { hash } from "node:crypto";
import { applyJobUsingEmail } from "../lib/apply-job";
import {
  getOrCreateRun,
  reportClassification,
  saveEmailThread,
  saveOutReachHandOff,
} from "../lib/agent-data";

export const inngest = new Inngest({ id: "my-app" });

const jobAgent = inngest.createFunction(
  {
    id: "job-agent",
    concurrency: {
      limit: 1,
    },
    triggers: [
      {
        event: "agent/job.process",
      },
    ],
  },
  async ({ event, step }) => {
    const { post, id } = event.data as { post: string; id: string };
    const run = await getOrCreateRun(id, { post });

    const classificationRes = await step.run("classify", async () => {
      const response = await classifyJobPosting({
        post: run.post,
        postedAt: new Date(run.posted_at),
      });
      await reportClassification(run.id, response.output);
      return response.output;
    });

    if (classificationRes.classification === "not_relevant")
      return { response: "Job is not relevant" };

    const emails = extractEmails(post);

    for await (const email of emails) {
      const emailHash = hash("sha1", email);
      await step.run(`send-email-${emailHash}`, async () => {
        const res = await applyJobUsingEmail(email, classificationRes);
        if (!res.threadId) return res;
        const saveRes = await saveEmailThread(run.id, {
          threadId: res.threadId,
          recipient: email,
        });
        return { ...res, saveRes };
      });
    }

    const outReachHandOffs = await step.run(`outreach-handoffs-0`, async () => {
      return (await handOffOutReaches(run)).output;
    });

    for (let i = 0; i < outReachHandOffs.handoffs.length; i += 1) {
      const handoff = outReachHandOffs.handoffs[i];
      await step.run(`save-outreach-handoff-${i}`, async () => {
        const res = await saveOutReachHandOff(handoff);
        return res;
      });
    }

    await step.sleep("wait-for-response", "12h");

    return {
      response: "Applied to all opportunities",
    };
  },
);

export const functions = [jobAgent];
