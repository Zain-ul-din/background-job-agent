export function extractEmails(text: string) {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return [...new Set(text.match(regex) || [])];
}

export function extractUrls(text: string) {
  const regex = /https?:\/\/[^\s<>"']+/gi;
  return [
    ...new Set(
      (text.match(regex) || []).map((url) => url.replace(/[.,;!?)}\]]+$/, "")),
    ),
  ];
}
