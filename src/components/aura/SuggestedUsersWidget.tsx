"use client";

import { useEffect, useState } from "react";
import { UserPlus, Check, Sparkles } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import type { AuraUser } from "@/lib/types";

export function SuggestedUsersWidget() {
  const { viewProfile } = useApp();
  const [users, setUsers] = useState<AuraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    aura
      .suggestedUsers()
      .then((r) => !cancelled && setUsers(r.users))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const follow = async (u: AuraUser) => {
    try {
      const r = await aura.follow(u.username);
      setFollowingIds((s) => {
        const n = new Set(s);
        if (r.following) n.add(u.id);
        else n.delete(u.id);
        return n;
      });
    } catch {
      // ignore
    }
  };

  if (loading || users.length === 0) return null;

  return (
    <div className="aura-card rounded-2xl border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-amber-300" />
        <h3 className="text-sm font-semibold">Suggested for you</h3>
      </div>
      <div className="space-y-3">
        {users.map((u) => {
          const isFollowing = followingIds.has(u.id);
          return (
            <div key={u.id} className="flex items-center gap-2.5">
              <Avatar
                username={u.username}
                avatarUrl={u.avatarUrl}
                avatarColor={u.avatarColor}
                isVerified={u.isVerified}
                size="sm"
                onClick={() => viewProfile(u.username)}
              />
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => viewProfile(u.username)}
                  className="flex items-center gap-1 text-sm font-semibold hover:underline truncate"
                >
                  <span className="truncate">{u.username}</span>
                  {u.isVerified && (
                    <svg viewBox="0 0 24 24" className="h-3 w-3 verified-badge shrink-0">
                      <path fill="oklch(0.78 0.2 60)" d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8L3.2 16l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 1.5z" />
                      <path fill="oklch(0.13 0.02 290)" d="M10.6 14.6l-2.3-2.3 1.4-1.4 1 1 3.2-3.2 1.4 1.4-4.7 4.5z" />
                    </svg>
                  )}
                </button>
                <p className="text-[10px] text-muted-foreground truncate">
                  {formatNumber(u.followerCount ?? 0)} followers
                </p>
              </div>
              <Button
                size="sm"
                variant={isFollowing ? "secondary" : "default"}
                onClick={() => follow(u)}
                className="h-7 px-2.5 text-xs"
              >
                {isFollowing ? <Check className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
