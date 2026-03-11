export default function getFirstImage(markdownBody: string): string | null {
  if (!markdownBody) return null;

  // Regex to match markdown image syntax: ![alt text](url)
  // Or HTML syntax: <img src="url" />
  const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/;
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/i;

  const mdMatch = markdownBody.match(mdRegex);
  if (mdMatch && mdMatch[1]) {
    return mdMatch[1];
  }

  const htmlMatch = markdownBody.match(htmlRegex);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1];
  }

  return null;
}
