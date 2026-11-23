import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "../../src/lib/db";
import { rolesTable } from "../../src/lib/db/schema";

/** Applies the real drizzle migrations to the in-memory test database. */
export async function setupTestDb() {
  await migrate(db, { migrationsFolder: "drizzle" });
}

export async function seedRole(
  overrides: Partial<typeof rolesTable.$inferInsert> = {},
) {
  const role = {
    slug: "frontend-engineer",
    name: "Frontend Engineer",
    email_template: "Hi, I'd love to apply for this role.",
    email_subject: "Application: Frontend Engineer",
    skills: "React, TypeScript, CSS",
    ...overrides,
  };
  await db.insert(rolesTable).values(role);
  return role;
}
