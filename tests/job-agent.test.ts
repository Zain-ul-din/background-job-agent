import { InngestTestEngine } from "@inngest/test";
import { beforeEach, describe, expect, it, vi } from "vitest";

// External side effects (AI providers, Gmail, DB) are mocked; this tests the
// orchestration in the job-agent Inngest function.
const mocks = vi.hoisted(() => ({
  classifyJobPosting: vi.fn(),
  handOffOutReaches: vi.fn(),
  applyJobUsingEmail: vi.fn(),
  getOrCreateRun: vi.fn(),
  reportClassification: vi.fn(),
  saveEmailThread: vi.fn(),
  saveOutReachHandOff: vi.fn(),
}));

vi.mock("../src/lib/ai", () => ({
  classifyJobPosting: mocks.classifyJobPosting,
  handOffOutReaches: mocks.handOffOutReaches,
}));
vi.mock("../src/lib/apply-job", () => ({
  applyJobUsingEmail: mocks.applyJobUsingEmail,
}));
vi.mock("../src/lib/agent-data", () => ({
  getOrCreateRun: mocks.getOrCreateRun,
  reportClassification: mocks.reportClassification,
  saveEmailThread: mocks.saveEmailThread,
  saveOutReachHandOff: mocks.saveOutReachHandOff,
}));

const { functions } = await import("../src/ingest");

const POST =
  "Hiring a Senior Frontend Engineer at TechCorp. Email jobs@techcorp.io or cto@techcorp.io";
const relevant = {
  classification: "relevant",
  confidence: 0.92,
  recommendedRole: "frontend-engineer",
};

const run = (post = POST) =>
  new InngestTestEngine({ function: functions[0] }).execute({
    events: [{ name: "agent/job.process", data: { id: "run-1", post } }],
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOrCreateRun.mockImplementation(async (id, { post }) => ({
    id,
    post,
    posted_at: Date.now(),
  }));
  mocks.applyJobUsingEmail.mockImplementation(async (to) => ({
    threadId: `thread-${to}`,
  }));
  mocks.handOffOutReaches.mockResolvedValue({ output: { handoffs: [] } });
});

describe("job-agent function", () => {
  it("stops after classification when the post is not relevant", async () => {
    mocks.classifyJobPosting.mockResolvedValue({
      ...relevant,
      classification: "not_relevant",
    });

    const { result } = await run();

    expect(result).toEqual({ response: "Job is not relevant" });
    expect(mocks.reportClassification).toHaveBeenCalledWith(
      "run-1",
      expect.objectContaining({ classification: "not_relevant" }),
    );
    expect(mocks.applyJobUsingEmail).not.toHaveBeenCalled();
    expect(mocks.handOffOutReaches).not.toHaveBeenCalled();
  });

  it("emails every recruiter once and records each thread", async () => {
    mocks.classifyJobPosting.mockResolvedValue(relevant);

    const { result } = await run();

    expect(result).toEqual({ response: "Applied to all opportunities" });
    expect(mocks.applyJobUsingEmail).toHaveBeenCalledTimes(2);
    expect(mocks.applyJobUsingEmail).toHaveBeenCalledWith("jobs@techcorp.io", relevant);
    expect(mocks.applyJobUsingEmail).toHaveBeenCalledWith("cto@techcorp.io", relevant);
    expect(mocks.saveEmailThread).toHaveBeenCalledWith("run-1", {
      threadId: "thread-jobs@techcorp.io",
      recipient: "jobs@techcorp.io",
    });
  });

  it("does not save a thread when sending returns no thread id", async () => {
    mocks.classifyJobPosting.mockResolvedValue(relevant);
    mocks.applyJobUsingEmail.mockResolvedValue({ threadId: null });

    await run("Hiring! Contact jobs@techcorp.io");

    expect(mocks.applyJobUsingEmail).toHaveBeenCalledTimes(1);
    expect(mocks.saveEmailThread).not.toHaveBeenCalled();
  });

  it("persists every generated outreach handoff", async () => {
    mocks.classifyJobPosting.mockResolvedValue(relevant);
    const handoffs = [
      { instructions: "Find the hiring manager on LinkedIn", acceptanceCriteria: "Profile URL" },
      { instructions: "Star the company's OSS repo", acceptanceCriteria: "Repo URL" },
    ];
    mocks.handOffOutReaches.mockResolvedValue({ output: { handoffs } });

    await run("Hiring, apply on our site");

    expect(mocks.applyJobUsingEmail).not.toHaveBeenCalled();
    expect(mocks.saveOutReachHandOff).toHaveBeenCalledTimes(2);
    expect(mocks.saveOutReachHandOff).toHaveBeenNthCalledWith(1, "run-1", handoffs[0]);
    expect(mocks.saveOutReachHandOff).toHaveBeenNthCalledWith(2, "run-1", handoffs[1]);
  });
});
