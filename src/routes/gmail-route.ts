import { Router } from "express";
import { createGmailClient } from "../lib/gmail-client";

const gmailRoute = Router();

gmailRoute.get("/", async (req, res) => {
  const gmail = await createGmailClient();

  const response = await gmail.users.messages.list({
    userId: "me",
    q: "from:kamrenm42@gmail.com",
    maxResults: 20,
  });

  const messages = response.data.messages;

  if (!Array.isArray(messages) || messages.length === 0)
    return res.status(200).json([]);

  const thread = await gmail.users.threads.get({
    id: messages[0].threadId!,
    userId: "me",
    format: "full",
  });

  res.status(200).json(thread);
});

export { gmailRoute };
