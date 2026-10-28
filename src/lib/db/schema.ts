import {
  sqliteTable,
  text,
  int,
  type AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";

export const rolesTable = sqliteTable("roles", {
  slug: text().primaryKey(),
  name: text().notNull(),
  email_template: text().notNull(),
  email_subject: text().notNull(),
  skills: text().notNull(),
});

export const oAuthSessionsTable = sqliteTable("oauth_sessions", {
  provider: text().primaryKey(),
  access_token: text().notNull(),
  refresh_token: text().notNull(),
  scope: text().notNull(),
  token_type: text().notNull(),
  refresh_token_expires_in: int(),
  expiry_date: int(),
});

export const runsTable = sqliteTable("runs", {
  id: text().primaryKey(),
  post: text().notNull(),
  posted_at: int().notNull(),
  created_at: int()
    .notNull()
    .$defaultFn(() => Date.now()),
  updated_at: int()
    .notNull()
    .$onUpdateFn(() => Date.now()),
});

export const jobPostClassificationsTable = sqliteTable(
  "job_post_classifications",
  {
    run_id: text()
      .primaryKey()
      .references(() => runsTable.id, { onDelete: "cascade" }),
    classification: text().notNull(),
    confidence: int().notNull(),
    recommendedRole: text().notNull(),
    created_at: int()
      .notNull()
      .$defaultFn(() => Date.now()),
    updated_at: int()
      .notNull()
      .$onUpdateFn(() => Date.now()),
  },
);

export const outReachHandOffsTable = sqliteTable("outreach_handoffs", {
  id: text().primaryKey(),
  run_id: text()
    .notNull()
    .references(() => runsTable.id, { onDelete: "cascade" }),
  instructions: text().notNull(),
  acceptance_criteria: text().notNull(),
  status: text().default("pending"), // "fail" | "success" | "pending"
  report_back: text(),
  parent_id: text().references(
    (): AnySQLiteColumn => outReachHandOffsTable.id,
    {
      onDelete: "cascade",
    },
  ),
  created_at: int()
    .notNull()
    .$defaultFn(() => Date.now()),
  updated_at: int()
    .notNull()
    .$onUpdateFn(() => Date.now()),
});

export const emailThreadsTable = sqliteTable("email_threads", {
  thread_id: text().primaryKey(),
  run_id: text()
    .notNull()
    .references(() => runsTable.id, { onDelete: "cascade" }),
  recipient: text().notNull(),
  created_at: int()
    .notNull()
    .$defaultFn(() => Date.now()),
});
