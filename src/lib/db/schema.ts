import { sqliteTable, text, int } from "drizzle-orm/sqlite-core";

export const oAuthSessionsTable = sqliteTable("oauth_sessions", {
  provider: text().primaryKey(),
  access_token: text().notNull(),
  refresh_token: text().notNull(),
  scope: text().notNull(),
  token_type: text().notNull(),
  refresh_token_expires_in: int(),
  expiry_date: int(),
});
