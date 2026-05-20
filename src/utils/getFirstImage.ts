export default function getFirstImage(markdownBody: string): string | null {
  if (!markdownBody) return null;

  // Regex to match markdown image syntax: ![alt text](url)
  // Or HTML syntax: <img src="url" />
  const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/;
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/i;

  const mdMatch = markdownBody.match(mdRegex);
  if (mdMatch && mdMatch[1]) {
    let url = mdMatch[1].trim();
    if (url.startsWith("<") && url.endsWith(">")) {
      url = url.slice(1, -1).trim();
    }
    return url.replace(/^@assets\//, "/assets/");
  }

  const htmlMatch = markdownBody.match(htmlRegex);
  if (htmlMatch && htmlMatch[1]) {
    let url = htmlMatch[1].trim();
    if (url.startsWith("<") && url.endsWith(">")) {
      url = url.slice(1, -1).trim();
    }
    return url.replace(/^@assets\//, "/assets/");
  }

  return null;
}
