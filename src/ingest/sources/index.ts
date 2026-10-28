import { multiselect } from "@clack/prompts";
import {
  getEnabledSources,
  initSourcesDb,
  setEnabledSources,
} from "../../lib/sources-db";
import { startWhatsAppSource } from "./whatsapp";

export async function startSources() {
  await initSourcesDb();

  const enabledSources = await getEnabledSources();

  if (enabledSources.length === 0) {
    const selected =
      ((await multiselect({
        message: "Select job sources to enable:",
        options: [
          {
            value: "whatsapp",
            label: "WhatsApp",
            hint: "Monitor WhatsApp job channels",
          },
          {
            value: "none",
            label: "None",
            hint: "Skip job sources",
          },
        ],
        required: false,
      })) as string[]) || [];

    if (selected.includes("none")) {
      await setEnabledSources([]);
    } else {
      await setEnabledSources(selected);
    }
  }

  const sources = await getEnabledSources();

  if (sources.includes("whatsapp")) {
    console.log("Starting WhatsApp source...");
    startWhatsAppSource();
  }
}
