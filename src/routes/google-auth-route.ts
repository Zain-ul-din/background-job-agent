import { Router } from "express";
import { randomBytes } from "node:crypto";
import { db } from "../lib/db";
import { oAuthSessionsTable } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { google } from "googleapis";
import { googleOAuth } from "../lib/auth/google-oauth";

const googleAuthRoute = Router();

// WARN: hardcoded state due to being single user application
// TODO: replace this with random string in production
const authStates = new Map<string, number>();

const scopes = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

googleAuthRoute.get("/", async (_, res) => {
  const state = randomBytes(32).toString("hex");
  authStates.set(state, Date.now() + 10 * 60_000);

  const url = googleOAuth.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent",
    redirect_uri: `${process.env.BASE_URL}/auth/google/callback`,
  });

  res.redirect(url);
});

googleAuthRoute.get("/info", async (_, res) => {
  try {
    const [session] = await db
      .select()
      .from(oAuthSessionsTable)
      .where(eq(oAuthSessionsTable.provider, "google"))
      .limit(1);

    if (!session) return res.json({ user: null });

    googleOAuth.setCredentials({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expiry_date: session.expiry_date ?? undefined,
    });

    const { data } = await google
      .oauth2("v2")
      .userinfo.get({ auth: googleOAuth });

    return res.json({
      user: data,
    });
  } catch (err) {
    console.error("Failed to fetch Google user info:", err);
    return res.status(500).json({
      user: null,
    });
  }
});

googleAuthRoute.get("/callback", async (req, res) => {
  const { error, code, state } = req.query;

  if (error) return res.status(400).send("Google Authorization denied");

  if (typeof code !== "string" || typeof state !== "string")
    return res.status(400).send("Invalid OAuth Callback");

  const expiredAt = authStates.get(state);
  authStates.delete(state);

  if (!expiredAt || expiredAt < Date.now())
    return res.status(403).send("Invalid or expired OAuth state");

  try {
    const { tokens } = await googleOAuth.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token)
      return res.status(500).send("Google did not return required tokens");

    const values = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope ?? scopes.join(" "),
      token_type: tokens.token_type ?? "Bearer",
      refresh_token_expires_in: null,
      expiry_date: tokens.expiry_date ?? null,
    };

    await db
      .insert(oAuthSessionsTable)
      .values({ provider: "google", ...values })
      .onConflictDoUpdate({
        target: oAuthSessionsTable.provider,
        set: values,
      });

    res.send("Google account connected successfully");
  } catch (err) {
    console.error("OAuth token exchange failed", err);
    res.status(500).send("Google connection failed");
  }
});

export { googleAuthRoute };
