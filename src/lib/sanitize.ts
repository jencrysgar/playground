import "server-only";
import sanitizeHtml from "sanitize-html";

/** Sanitize imported HTML for safe rendering (keeps headings, media, embeds). */
export function sanitizeImportedHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote",
      "ul", "ol", "li", "strong", "b", "em", "i", "u", "s", "code", "pre",
      "a", "img", "figure", "figcaption", "video", "source", "iframe",
      "table", "thead", "tbody", "tr", "th", "td", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      video: ["src", "controls", "width", "height", "poster"],
      source: ["src", "type"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder", "title"],
      "*": [],
    },
    allowedSchemes: ["http", "https", "data", "mailto"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedIframeHostnames: [
      "www.youtube.com", "youtube.com", "youtu.be",
      "player.vimeo.com", "vimeo.com", "www.loom.com", "loom.com",
    ],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
      }),
    },
  });
}
