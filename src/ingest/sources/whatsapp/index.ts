import { connectWhatsApp } from "./client";

const BASE_URL = process.env.BASE_URL || "http://localhost:3010";

export async function startWhatsAppSource(): Promise<void> {
  await connectWhatsApp(async (post, id) => {
    await fetch(`${BASE_URL}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post, id }),
    });
    console.log("Sent job post to /process:", id);
  });
}
