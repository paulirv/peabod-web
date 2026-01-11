"use client";

import DOMPurify from "isomorphic-dompurify";
import { useMemo } from "react";

interface HtmlContentProps {
  content: string;
  className?: string;
}

/**
 * Renders HTML content from the WYSIWYG editor with XSS sanitization.
 * Also handles legacy content (newline-separated plain text) for backward compatibility.
 */
export default function HtmlContent({ content, className = "" }: HtmlContentProps) {
  // Check if content appears to be HTML (contains HTML tags)
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  // Sanitize HTML content using DOMPurify to prevent XSS attacks
  const sanitizedHtml = useMemo(() => {
    if (!isHtml) return "";
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: [
        "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
        "h1", "h2", "h3", "h4", "h5", "h6",
        "ul", "ol", "li",
        "blockquote", "pre", "code",
        "a", "img", "iframe",
        "table", "thead", "tbody", "tr", "th", "td",
        "hr", "span", "div"
      ],
      ALLOWED_ATTR: [
        "href", "src", "alt", "title", "class", "target", "rel",
        "width", "height", "frameborder", "allow", "allowfullscreen",
        "colspan", "rowspan"
      ],
      ALLOW_DATA_ATTR: false,
    });
  }, [content, isHtml]);

  if (isHtml) {
    // Render sanitized HTML content
    return (
      <div
        className={`prose prose-lg max-w-none ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  // Fallback: render legacy newline-separated content
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      {content.split("\n").map((paragraph, index) => (
        <p key={index} className="mb-4 text-foreground leading-relaxed">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
