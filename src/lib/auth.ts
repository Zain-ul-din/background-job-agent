import { eq } from "drizzle-orm";
import { db } from "./db/db";
import { oAuthSessionsTable } from "./db/schema";
import { googleOAuth } from "./google-oauth";

function updateGoogleOAuthSession() {
  googleOAuth.on("tokens", async (newTokens) => {
    await db
      .update(oAuthSessionsTable)
      .set({
        access_token: newTokens.access_token ?? undefined,
        refresh_token: newTokens.refresh_token ?? undefined,
        expiry_date: newTokens.expiry_date ?? undefined,
      })
      .where(eq(oAuthSessionsTable.provider, "google"))
      .then((res) => {
        if (res.rowsAffected === 0)
          console.warn("tokens event: no oauth row to update");
      })
      .catch((err) => {
        console.error("Failed to persist refreshed tokens", err);
      });
  });
}

let called = false;

export function initAuth() {
  if (called) return;
  called = true;
  updateGoogleOAuthSession();
}
