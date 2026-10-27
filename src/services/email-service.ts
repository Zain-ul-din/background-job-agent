import { createTransport, type SendMailOptions } from "nodemailer";
import { createGmailClient } from "../lib/gmail-client";

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toHtml(text: string): string {
  const content = escapeHtml(text).replace(
    /https?:\/\/[^\s<]+/g,
    (url) =>
      `<a href="${url}" style="color:#2563eb;text-decoration:none;">${url}</a>`,
  );
  return `<div style="max-width:640px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:18px;line-height:1.6;color:#111827;white-space:pre-wrap;">${content}</div>`;
}
