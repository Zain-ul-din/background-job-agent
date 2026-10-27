import { google } from "googleapis";
import { googleOAuth } from "./google-oauth";
import { db } from "./db/db";
import { oAuthSessionsTable } from "./db/schema";
import { eq } from "drizzle-orm";

export async function createGmailClient() {
  const [session] = await db
    .select()
    .from(oAuthSessionsTable)
    .where(eq(oAuthSessionsTable.provider, "google"))
    .limit(1);

  if (!session) throw new Error("No Google OAuth session found in the DB.");

  googleOAuth.setCredentials({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expiry_date: session.expiry_date ?? undefined,
  });

  return google.gmail({
    version: "v1",
    auth: googleOAuth,
  });
}
