import { readFileSync } from "node:fs";

export function loadTemplate({ role }: { role: string }) {
  const path = `${process.cwd()}/templates/full-stack.md`;
  const template = readFileSync(path, "utf-8");
  return template.replaceAll("{{role}}", role);
}
