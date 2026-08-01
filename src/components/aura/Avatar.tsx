"use client";

import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "./VerifiedBadge";

const colorMap: Record<string, string> = {
  violet: "from-violet-500 to-fuchsia-500",
  rose: "from-rose-500 to-pink-500",
  amber: "from-amber-500 to-orange-500",
  emerald: "from-emerald-500 to-teal-500",
  sky: "from-sky-500 to-cyan-500",
  fuchsia: "from-fuchsia-500 to-purple-500",
  orange: "from-orange-500 to-red-500",
  teal: "from-teal-500 to-emerald-500",
};

export function Avatar({
  username,
  avatarUrl,
  avatarColor,
  isVerified,
  isAdmin,
  size = "md",
  showBadge = true,
  onClick,
}: {
  username: string;
  avatarUrl?: string;
  avatarColor?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showBadge?: boolean;
  onClick?: () => void;
}) {
  const sizes = {
    xs: "h-7 w-7 text-xs",
    sm: "h-9 w-9 text-sm",
    md: "h-11 w-11 text-base",
    lg: "h-16 w-16 text-xl",
    xl: "h-28 w-28 text-4xl",
  };
  const badgeSizes = {
    xs: "h-3 w-3 -bottom-0 -right-0",
    sm: "h-3.5 w-3.5 -bottom-0.5 -right-0.5",
    md: "h-4 w-4 -bottom-0.5 -right-0.5",
    lg: "h-5 w-5 -bottom-1 -right-1",
    xl: "h-8 w-8 -bottom-1 -right-1",
  };
  const grad = colorMap[avatarColor || "violet"] || colorMap.violet;
  const initial = (username || "?").charAt(0).toUpperCase();

  return (
    <div
      className={cn("relative inline-block shrink-0", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      <div
        className={cn(
          "relative flex items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ring-2 ring-white/10 overflow-hidden",
          grad,
          sizes[size]
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      {showBadge && isVerified && (
        <div className={cn("absolute", badgeSizes[size])}>
          <VerifiedBadge />
        </div>
      )}
    </div>
  );
}
