import express from "express";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
vi.mock("../src/ingest", () => ({ inngest: { send } }));

const { processRoute } = await import("../src/routes/process-route");

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/process", processRoute);
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => server.close());
beforeEach(() => send.mockReset());

const post = (body: unknown) =>
  fetch(`${baseUrl}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /process", () => {
  it("uses the caller's id as both the event id and the run id", async () => {
    const res = await post({ post: "Hiring a React dev", id: "wa-123" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, id: "wa-123" });
    expect(send).toHaveBeenCalledWith({
      id: "job-post-wa-123",
      name: "agent/job.process",
      data: { id: "wa-123", post: "Hiring a React dev" },
    });
  });

  it("generates one id for both the event and the run when none is given", async () => {
    const res = await post({ post: "Hiring a React dev" });
    const { id } = await res.json();

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ id: `job-post-${id}`, data: { id, post: "Hiring a React dev" } }),
    );
  });

  it.each([{}, { post: "" }, { post: "   " }, { post: 42 }])(
    "rejects an invalid body %j without emitting an event",
    async (body) => {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect((await res.json()).success).toBe(false);
      expect(send).not.toHaveBeenCalled();
    },
  );
});
