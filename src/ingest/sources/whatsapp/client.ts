import makeWASocket, {
  DisconnectReason,
  NewsletterMetadata,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import { randomUUID } from "node:crypto";

const AUTH_STATE_DIR = ".whatsapp_auth";
const trackedSuffixes = ["@broadcast", "@newsletter"];

const isTrackedChat = (jid: string): boolean =>
  jid !== "status@broadcast" &&
  trackedSuffixes.some((suffix) => jid.endsWith(suffix));

function extractChannelName(metadata: NewsletterMetadata): string {
  if (!metadata.thread_metadata?.name) return "";
  if (typeof metadata.thread_metadata.name === "string")
    return metadata.thread_metadata.name;

  const nameObj = metadata.thread_metadata.name as { text: string };
  if (typeof nameObj === "object" && "text" in nameObj) return nameObj.text;
  return "";
}

export async function connectWhatsApp(
  onJobPost: (post: string, id: string) => void,
): Promise<void> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_STATE_DIR);
  const sock = makeWASocket({ auth: state, syncFullHistory: true });

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "open") {
      console.log("WhatsApp connection opened");
      return;
    }

    if (connection !== "close") return;

    const shouldReconnect =
      (lastDisconnect?.error as Boom)?.output?.statusCode !==
      DisconnectReason.loggedOut;
    console.log(
      "connection closed due to",
      lastDisconnect?.error,
      ", reconnecting:",
      shouldReconnect,
    );
    if (shouldReconnect) void connectWhatsApp(onJobPost);
  });

  sock.ev.on("messaging-history.set", ({ progress }) => {
    console.log(`sync: ${progress}`);
  });

  sock.ev.process(async (events) => {
    const messages =
      events["messages.upsert"]?.messages ||
      events["messaging-history.set"]?.messages ||
      [];

    for (const message of messages) {
      const key = message.key;
      const jid = key?.remoteJid;

      if (!key?.remoteJid || key.fromMe || !isTrackedChat(key.remoteJid))
        continue;

      if (jid && jid.endsWith("@newsletter")) {
        const metadata = await sock.newsletterMetadata("jid", jid);
        if (!metadata) continue;

        const channelName = extractChannelName(metadata);
        if (channelName.toLowerCase().includes("job")) {
          const post =
            message.message?.conversation ||
            message.message?.imageMessage?.caption;
          if (post) {
            onJobPost(post, key.id ?? randomUUID());
          }
        }
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);
}
