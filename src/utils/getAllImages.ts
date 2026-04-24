export default function getAllImages(markdownBody: string): string[] {
  if (!markdownBody) return [];

  // Regex to match markdown image syntax: ![alt text](url)
  const mdRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  // Regex to match HTML image syntax: <img src="url" />
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;

  const images: string[] = [];
  let match;

  while ((match = mdRegex.exec(markdownBody)) !== null) {
    if (match[1]) {
      images.push(match[1].replace(/^@assets\//, "/assets/"));
    }
  }

  while ((match = htmlRegex.exec(markdownBody)) !== null) {
    if (match[1]) {
      images.push(match[1].replace(/^@assets\//, "/assets/"));
    }
  }

  // Return unique, non-empty images
  return [...new Set(images.filter(Boolean))];
}
