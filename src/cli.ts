import { intro, text } from "@clack/prompts";
import color from "picocolors";

export function runCLI({ baseUrl }: { baseUrl: string }) {
  intro(color.inverse(" setting up things "));
  text({ message: `Authenticate your gmail ${baseUrl + "/auth/google"}` });
}
