import { createElement } from "react";
import sanitizeHtml from "sanitize-html";

/**
 * Renders an admin-editable headline string. Source is sanitised
 * through DOMPurify (allow-list of inline tags + style attr) so the
 * dangerouslySetInnerHTML call below is bounded — only the
 * sanitiser's whitelist survives. Two input shapes are accepted:
 *   • HTML from the admin's Tiptap RichTextEditor.
 *   • Legacy markdown-lite: `*word*` italic, `**word**` bold/outline,
 *     `\n` line break.
 *
 * Mirrors the existing StorySection pipeline so the admin → public
 * parity is identical across sections.
 */
export function RichHeadline({
  source,
  as = "div",
  className,
  style,
  boldStyle,
  italicStyle,
}: {
  source: string;
  as?: "div" | "h2" | "h3" | "p" | "span";
  className?: string;
  style?: React.CSSProperties;
  boldStyle: string;
  italicStyle: string;
}) {
  const html = looksLikeHtml(source)
    ? processHtml(source, { boldStyle, italicStyle })
    : markdownToHtml(source, { boldStyle, italicStyle });

  return createElement(as, {
    className,
    style,
    suppressHydrationWarning: true,
    // eslint-disable-next-line react/no-danger -- sanitised above via DOMPurify
    dangerouslySetInnerHTML: { __html: html },
  });
}

function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*?>/i.test(s);
}

function processHtml(
  source: string,
  opts: { boldStyle: string; italicStyle: string },
): string {
  const sanitized = sanitizeKeepStyles(source, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "b", "i", "u", "s", "span",
      "h1", "h2", "h3", "h4", "h5", "h6", "a",
    ],
    ALLOWED_ATTR: ["style", "class", "href", "target", "rel"],
  });
  const unwrapped = stripOuterParagraphs(sanitized);
  return inlineMarkdownToHtml(unwrapped, opts);
}

function markdownToHtml(
  source: string,
  opts: { boldStyle: string; italicStyle: string },
): string {
  const withBreaks = source.replace(/\n/g, "<br/>");
  return inlineMarkdownToHtml(withBreaks, opts);
}

function inlineMarkdownToHtml(
  html: string,
  opts: { boldStyle: string; italicStyle: string },
): string {
  return html
    .replace(
      /\*\*([^*<>\n]+)\*\*/g,
      `<span style="${opts.boldStyle}">$1</span>`,
    )
    .replace(
      /(^|[^*])\*([^*<>\n]+)\*(?!\*)/g,
      `$1<span style="${opts.italicStyle}">$2</span>`,
    );
}

function stripOuterParagraphs(html: string): string {
  if (!/<p\b[^>]*>/i.test(html)) return html;
  const pattern = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
  const collected = Array.from(html.matchAll(pattern), (m) => m[1].trim());
  if (collected.length === 0) {
    return html.replace(/<\/?p\b[^>]*>/gi, "");
  }
  const FONT_SIZE_RE = /font-size:\s*([\d.]+(?:px|em|rem|pt|%))/i;
  return collected
    .filter(Boolean)
    .map((line) => {
      const match = line.match(FONT_SIZE_RE);
      const sizeDecl = match ? `;font-size:${match[1]}` : "";
      return `<span style="display:block;line-height:1${sizeDecl}">${line}</span>`;
    })
    .join("");
}

function sanitizeKeepStyles(
  html: string,
  config: { ALLOWED_TAGS: string[]; ALLOWED_ATTR: string[] },
): string {
  // Use the Node-native `sanitize-html` (htmlparser2) instead of
  // `isomorphic-dompurify`. The latter eagerly loads jsdom at server
  // module init, whose transitive `@exodus/bytes` throws ERR_REQUIRE_ESM
  // on Vercel's Node and 500'd every page that pulls this component in
  // (CtaBand, ValuesGrid → /about). Inline styles are kept verbatim;
  // scripts / on* handlers / javascript: URLs are stripped.
  return sanitizeHtml(html, {
    allowedTags: config.ALLOWED_TAGS,
    allowedAttributes: { "*": config.ALLOWED_ATTR },
  });
}
