import { Router } from "express";
import { googleOAuth } from "../lib/google-oauth";
import { randomBytes } from "node:crypto";

const googleAuthRoute = Router();

// WARN: hardcoded state due to being single user application
// TODO: replace this with random string in production
const authStates = new Map<string, number>();

googleAuthRoute.get("/", async (_, res) => {
  const scope = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
  ];

  const state = randomBytes(32).toString("hex");
  authStates.set(state, Date.now() + 10 * 60_000);

  const url = googleOAuth.generateAuthUrl({
    access_type: "offline",
    scope,
    state,
    prompt: "consent",
    redirect_uri: `${process.env.BASE_URL}/auth/google/callback`,
  });

  res.redirect(url);
});

googleAuthRoute.get("/callback", async (req, res) => {
  const { error, code, state } = req.query;

  if (error) return res.status(400).send("Google Authorization denied");

  if (typeof code !== "string" || typeof state !== "string")
    return res.status(400).send("Invalid OAuth Callback");

  const expiredAt = authStates.get(state as string);
  authStates.delete(state);

  if (!expiredAt || expiredAt < Date.now())
    return res.status(403).send("Invalid or expired OAuth state");

  try {
    const { tokens } = await googleOAuth.getToken(code);
    res.send(tokens);
  } catch (err) {
    console.error("OAuth token exchange failed", error);
    res.status(500).send("Google connection failed");
  }
});

export { googleAuthRoute };
