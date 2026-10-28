import { createTransport, type SendMailOptions } from "nodemailer";
import { createGmailClient } from "./gmail-client";
import { toHtml } from "./utils";

const mimeTransporter = createTransport({
  streamTransport: true,
  buffer: true,
  newline: "unix",
});

type SendEmailOptions = Omit<SendMailOptions, "from"> & {
  threadId?: string;
};

export async function sendEmail(options: SendEmailOptions) {
  const gmail = await createGmailClient();
  const from = process.env.GOOGLE_USER;

  const mime = await mimeTransporter.sendMail({
    ...options,
    html:
      options.html ??
      (typeof options.text === "string" ? toHtml(options.text) : undefined),
    from,
  });

  if (!Buffer.isBuffer(mime.message))
    throw new Error("Failed to generate MIME email");

  const raw = mime.message.toString("base64url");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw,
      threadId: options.threadId,
    },
  });

  return response.data;
}
