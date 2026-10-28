import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import * as path from "path";

interface SourcesData {
  sources: string[];
}

const file = path.join(process.cwd(), "sources.json");
const adapter = new JSONFile<SourcesData>(file);
const db = new Low(adapter, { sources: [] });

export async function initSourcesDb(): Promise<void> {
  await db.read();
  if (!db.data) {
    db.data = { sources: [] };
    await db.write();
  }
}

export async function getEnabledSources(): Promise<string[]> {
  await db.read();
  return db.data?.sources || [];
}

export async function setEnabledSources(sources: string[]): Promise<void> {
  await db.read();
  db.data = { sources };
  await db.write();
}

export async function isSourceEnabled(source: string): Promise<boolean> {
  const sources = await getEnabledSources();
  return sources.includes(source);
}
