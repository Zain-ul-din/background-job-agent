function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toHtml(text: string): string {
  const content = escapeHtml(text).replace(
    /https?:\/\/[^\s<]+/g,
    (url) =>
      `<a href="${url}" style="color:#2563eb;text-decoration:none;">${url}</a>`,
  );
  return `<div style="max-width:640px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:18px;line-height:1.6;color:#111827;white-space:pre-wrap;">${content}</div>`;
}
