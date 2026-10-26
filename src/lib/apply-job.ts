import { sendEmail } from "../services/email-service";
import { loadTemplate } from "./load-template";
import { ClassificationSchema } from "./schema";

export const roles: Record<ClassificationSchema["recommendedResume"], string> =
  {
    "ai-engineering": "AI Engineer",
    "full-stack": "Full Stack Developer",
    "frontend-developer": "Frontend Developer",
  };

export async function applyJobUsingEmail(
  email: string,
  classification: ClassificationSchema,
) {
  const res = await sendEmail({
    to: email,
    text: loadTemplate({
      role: roles[classification.recommendedResume],
    }),
    subject: `Application for ${roles[classification.recommendedResume]}`,
  });

  return res;
}
