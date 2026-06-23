// Pure helpers (no browser/server APIs) for inlining a saved webpage's local
// images into the HTML as data: URIs, so an offline page keeps its images.

/** Last path segment of a src, lowercased, without query/hash. */
export function basename(src: string): string {
  let s = src;
  try {
    s = decodeURIComponent(s);
  } catch {
    // keep original on malformed encoding
  }
  s = s.split(/[?#]/)[0];
  const seg = s.split("/").pop() ?? "";
  return seg.trim().toLowerCase();
}

export type InlineResult = {
  html: string;
  replaced: number;
  unresolved: string[]; // local image refs we couldn't match to a provided file
};

/**
 * Replace <img src="..."> references with provided data URIs, matched by file
 * name. Absolute http(s) URLs and existing data: URIs are left untouched.
 * `images` maps a lowercased basename (e.g. "photo.png") to a data: URI.
 */
export function inlineImages(html: string, images: Record<string, string>): InlineResult {
  let replaced = 0;
  const unresolved: string[] = [];

  const out = html.replace(/<img\b[^>]*>/gi, (tag) => {
    const m = tag.match(/\ssrc\s*=\s*["']([^"']+)["']/i);
    if (!m) return tag;
    const src = m[1];
    if (/^data:/i.test(src)) return tag;
    const key = basename(src);
    const dataUri = key ? images[key] : undefined;
    if (dataUri) {
      replaced++;
      return tag.replace(m[0], ` src="${dataUri}"`);
    }
    if (!/^https?:\/\//i.test(src)) unresolved.push(src);
    return tag;
  });

  return { html: out, replaced, unresolved };
}
