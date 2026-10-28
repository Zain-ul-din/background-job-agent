import { eq } from "drizzle-orm";
import { db } from "./db";
import { rolesTable } from "./db/schema";
import { ClassificationSchema } from "./schema";
import { sendEmail } from "./email/send-email";

export async function applyJobUsingEmail(
  email: string,
  classification: ClassificationSchema,
) {
  const [role] = await db
    .select()
    .from(rolesTable)
    .where(eq(rolesTable.slug, classification.recommendedRole))
    .limit(1);

  const res = await sendEmail({
    to: email,
    text: role.email_template,
    subject: role.email_subject,
  });

  return res;
}
