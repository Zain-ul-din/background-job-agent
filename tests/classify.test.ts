import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../src/lib/db";
import { rolesTable } from "../src/lib/db/schema";
import { seedRole, setupTestDb } from "./helpers/db";

const decide = vi.hoisted(() => vi.fn());

vi.mock("ai", async (importOriginal) => ({
  ...(await importOriginal<typeof import("ai")>()),
  experimental_decide: decide,
}));
// Avoid constructing real provider clients (they need API keys).
vi.mock("../src/lib/models", () => ({
  models: { mistral: {}, openaiSubscription: {} },
  decisionModels: { clef: {} },
}));

const { classifyJobPosting } = await import("../src/lib/ai");

const post = { post: "Hiring a React developer", postedAt: new Date("2026-11-01") };

beforeAll(setupTestDb);
beforeEach(async () => {
  decide.mockReset();
  await db.delete(rolesTable);
});

describe("classifyJobPosting", () => {
  it("refuses to classify when no roles are configured", async () => {
    await expect(classifyJobPosting(post)).rejects.toThrow(/No roles configured/);
    expect(decide).not.toHaveBeenCalled();
  });

  it("uses the only role and skips the role question for a single role", async () => {
    await seedRole();
    decide.mockResolvedValue({
      answers: {
        classification: {
          type: "choice",
          choice: "relevant",
          probabilities: { relevant: 0.8, not_relevant: 0.2 },
        },
      },
    });

    await expect(classifyJobPosting(post)).resolves.toEqual({
      classification: "relevant",
      confidence: 0.8,
      recommendedRole: "frontend-engineer",
    });
    expect(Object.keys(decide.mock.calls[0][0].questions)).toEqual(["classification"]);
  });

  it("asks the model to pick between roles when several exist", async () => {
    await seedRole();
    await seedRole({ slug: "backend-engineer", name: "Backend Engineer", skills: "Node, Postgres" });
    decide.mockResolvedValue({
      answers: {
        classification: { type: "choice", choice: "relevant", probabilities: { relevant: 0.7 } },
        recommendedRole: { type: "choice", choice: "backend-engineer" },
      },
    });

    const result = await classifyJobPosting(post);

    expect(result.recommendedRole).toBe("backend-engineer");
    const { questions, state } = decide.mock.calls[0][0];
    expect(questions.recommendedRole.criteria).toEqual({
      "frontend-engineer": "Frontend Engineer",
      "backend-engineer": "Backend Engineer",
    });
    expect(state).toContain("- Backend Engineer: Node, Postgres");
  });

  it("falls back to 0 confidence when the model returns no probabilities", async () => {
    await seedRole();
    decide.mockResolvedValue({
      answers: { classification: { type: "choice", choice: "not_relevant" } },
    });

    expect((await classifyJobPosting(post)).confidence).toBe(0);
  });
});
