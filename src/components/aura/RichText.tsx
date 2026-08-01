import React from "react";

/**
 * Render text with @mentions and #hashtags linkified.
 * Mentions become clickable links to the user's profile.
 * Hashtags become clickable links that trigger a search.
 */
export function RichText({
  text,
  onMention,
  onHashtag,
  className,
}: {
  text: string;
  onMention?: (username: string) => void;
  onHashtag?: (tag: string) => void;
  className?: string;
}) {
  // Split on @mentions and #hashtags while keeping the delimiters
  const parts = text.split(/(@[a-zA-Z0-9_]+|#[a-zA-Z0-9_]+)/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (/^@[a-zA-Z0-9_]+$/.test(part)) {
          const username = part.slice(1);
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onMention?.(username);
              }}
              className="text-violet-300 hover:text-violet-200 hover:underline font-medium transition"
            >
              {part}
            </button>
          );
        }
        if (/^#[a-zA-Z0-9_]+$/.test(part)) {
          const tag = part.slice(1);
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                onHashtag?.(tag);
              }}
              className="text-sky-300 hover:text-sky-200 hover:underline font-medium transition"
            >
              {part}
            </button>
          );
        }
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
