import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";

import z from "zod";
import { db } from "../src/lib/db";
import { outReachHandOffsTable, runsTable } from "../src/lib/db/schema";
import { asc, eq, count, inArray } from "drizzle-orm";
import { encode } from "@toon-format/toon";

const server = new McpServer({ name: "outreach-handoffs", version: "1.0.0" });

server.registerTool(
  "get-handoffs",
  {
    description: "Returns all outreach handoffs group by run",
    inputSchema: z.object({}),
  },
  async () => {
    try {
      const handoffs = await db
        .select({
          runId: runsTable.id,
          pendingCounts: count(outReachHandOffsTable.id),
        })
        .from(outReachHandOffsTable)
        .leftJoin(runsTable, eq(runsTable.id, outReachHandOffsTable.run_id))
        .where(eq(outReachHandOffsTable.status, "pending"))
        .orderBy(asc(runsTable.created_at))
        .groupBy(runsTable.id);

      return {
        content: [{ type: "text", text: encode(handoffs) }],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get handoffs: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
);

server.registerTool(
  "get-run",
  {
    description: "Returns run with job post body",
    inputSchema: z.object({ runId: z.string() }),
  },
  async ({ runId }) => {
    try {
      const run = await db
        .select()
        .from(runsTable)
        .where(eq(runsTable.id, runId));
      return {
        content: [
          {
            type: "text",
            text: encode(run),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get run: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
);

server.registerTool(
  "get-handoffs-by-ids",
  {
    description: "Returns outreach handoffs with details",
    inputSchema: z.object({
      handoffIds: z.array(z.string()),
    }),
  },
  async ({ handoffIds }) => {
    try {
      const handoffs = await db
        .select()
        .from(outReachHandOffsTable)
        .where(inArray(outReachHandOffsTable.id, handoffIds));

      return {
        content: [
          {
            type: "text",
            text: encode(handoffs),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to get handoffs by ids: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
);

server.registerTool(
  "report-outreach-handoff",
  {
    description: "Report outcome of outreach",
    inputSchema: z.object({
      handOffId: z.string(),
      status: z.enum(["pending", "success", "fail"]),
      report_back: z.string().describe("concise summary what happened?"),
    }),
  },
  async ({ handOffId, status, report_back }) => {
    try {
      const res = await db
        .update(outReachHandOffsTable)
        .set({
          status,
          report_back,
        })
        .where(eq(outReachHandOffsTable.id, handOffId));

      return {
        content: [
          {
            type: "text",
            text: `Successfully reported ${handOffId}\nDB Effected Rows: ${res.rowsAffected}`,
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to report ${handOffId}: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main();
