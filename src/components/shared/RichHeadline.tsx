import { createElement } from "react";
import DOMPurify from "isomorphic-dompurify";

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
  const styles: string[] = [];
  const stashed = html.replace(/\sstyle="([^"]*)"/gi, (_match, value) => {
    const idx = styles.push(value) - 1;
    return ` data-bsi-style="${idx}"`;
  });
  const cleaned = DOMPurify.sanitize(stashed, {
    ALLOWED_TAGS: config.ALLOWED_TAGS,
    ALLOWED_ATTR: [...config.ALLOWED_ATTR, "data-bsi-style"],
  });
  return cleaned.replace(/\sdata-bsi-style="(\d+)"/g, (_m, idx) => {
    const value = styles[Number(idx)];
    if (!value) return "";
    return ` style="${value.replace(/"/g, "&quot;")}"`;
  });
}
