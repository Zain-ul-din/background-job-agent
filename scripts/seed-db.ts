import "dotenv/config";
import { db } from "../src/lib/db";
import { rolesTable } from "../src/lib/db/schema";

const developerEmailTemplate = `
Hi,

I'm Zain, a Full Stack Developer with 4+ years of professional experience building web applications and working with remote clients across the US and Australia.

I came across your opening for a {{role}} and would love to explore the opportunity.

My technical experience includes {{skills}}. I focus on building reliable, maintainable, and scalable applications while following modern engineering best practices.


Resume: https://www.zainuldin.dev/Zain_Ul_Din_Resume.pdf
Portfolio: https://www.zainuldin.dev/?ref=recruiter

Best regards,
Zain Ul Din
`.trim();

const aiEngineerEmailTemplate = `
Hi,

I'm Zain, a Software Engineer with 4+ years of professional experience, specializing in Full Stack Development and Applied AI Engineering. I've worked with remote clients across the US and Australia.

I came across your opening for an {{role}} and would love to explore the opportunity.

My technical experience includes {{skills}}. I focus on developing AI-powered applications, integrating LLMs into real-world products, and building reliable backend systems.

My software engineering background also allows me to work across the entire AI application lifecycle, from backend architecture and AI integrations to deployment and production maintenance.


Resume: https://www.zainuldin.dev/Zain_Ul_Din_Resume.pdf
Portfolio: https://www.zainuldin.dev/?ref=recruiter

Best regards,
Zain Ul Din
`.trim();

const roles: (typeof rolesTable.$inferInsert)[] = [
  {
    name: "Frontend Developer",
    slug: "frontend",
    skills:
      "HTML, CSS, JavaScript, TypeScript, React, Next.js, Tailwind CSS, shadcn/ui, and modern frontend libraries",
    email_subject: "Application for Frontend Developer",
    email_template: developerEmailTemplate,
  },
  {
    name: "Full Stack Developer",
    slug: "fullstack-developer",
    skills:
      "JavaScript, TypeScript, React, Next.js, Node.js, PostgreSQL, Supabase, Python, FastAPI, and REST APIs",
    email_subject: "Application for Full Stack Developer",
    email_template: developerEmailTemplate,
  },
  {
    name: "AI Engineer",
    slug: "ai",
    skills:
      "TypeScript, Python, Node.js, FastAPI, OpenAI API, Vercel AI SDK, LangChain, AI Agents, Tool Calling, Structured Outputs, RAG, Embeddings, Vector Search, Prompt Engineering, LLM Evaluations, Observability, and PostgreSQL",
    email_subject: "Application for AI Engineer",
    email_template: aiEngineerEmailTemplate,
  },
];

const data = roles.map((role) => ({
  ...role,
  email_template: role.email_template
    .replaceAll("{{role}}", role.name)
    .replaceAll("{{skills}}", role.skills),
}));

const res = await db.insert(rolesTable).values(data);

console.log(res);
