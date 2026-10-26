import { Inngest } from "inngest";
import { classifyJobPosting } from "../lib/ai";
import { extractEmails } from "../lib/utils/parsers";
import { hash } from "node:crypto";
import { applyJobUsingEmail } from "../lib/apply-job";

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
    const { post } = event.data as { post: string };

    const classificationRes = await step.run("classify", async () => {
      const response = await classifyJobPosting({
        post,
        postedAt: new Date(),
      });
      return response.output;
    });

    if (classificationRes.classification === "not_relevant")
      return { response: "Job is not relevant" };

    const emails = extractEmails(post);

    for await (const email of emails) {
      const emailHash = hash("sha1", email);
      await step.run(`send-email-${emailHash}`, async () => {
        const res = await applyJobUsingEmail(email, classificationRes);
        return res;
      });
    }

    return {
      response: "Applied to all opportunities",
    };
  },
);

export const functions = [jobAgent];
