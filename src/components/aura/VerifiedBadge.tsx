"use client";

import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("verified-badge h-full w-full", className)}
      aria-label="Verified"
    >
      <defs>
        <linearGradient id="aura-verified" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.6 0.22 258)" />
          <stop offset="100%" stopColor="oklch(0.52 0.22 264)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#aura-verified)"
        d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8L3.2 16l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 1.5z"
      />
      <path
        fill="white"
        d="M10.6 14.6l-2.3-2.3 1.4-1.4 1 1 3.2-3.2 1.4 1.4-4.7 4.5z"
      />
    </svg>
  );
}

export function VerifiedInline({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex align-middle verified-badge", className)}
      title="Verified by AuraMedia"
    >
      <VerifiedBadge className="h-3.5 w-3.5" />
    </span>
  );
}
