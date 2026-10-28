import { Router } from "express";
import { db } from "../lib/db";
import { rolesTable } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const rolesRoute = Router();

rolesRoute.get("/", async (_, res) => {
  try {
    const roles = await db.select().from(rolesTable);
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

rolesRoute.post("/", async (req, res) => {
  const { name, email_template, email_subject, skills } = req.body;

  if (!name || !email_template || !email_subject || !skills) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  try {
    await db.insert(rolesTable).values({
      slug,
      name,
      email_template,
      email_subject,
      skills,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save role" });
  }
});

rolesRoute.put("/:slug", async (req, res) => {
  const { slug } = req.params;
  const { name, email_template, email_subject, skills } = req.body;

  if (!name || !email_template || !email_subject || !skills) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await db
      .update(rolesTable)
      .set({ name, email_template, email_subject, skills })
      .where(eq(rolesTable.slug, slug));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update role" });
  }
});

rolesRoute.delete("/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    await db.delete(rolesTable).where(eq(rolesTable.slug, slug));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete role" });
  }
});

export { rolesRoute };
