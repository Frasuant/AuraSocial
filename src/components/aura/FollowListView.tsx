"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, UserPlus, Check, Loader2, Users } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/button";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { AuraUser } from "@/lib/types";

export function FollowListView({ mode }: { mode: "followers" | "following" }) {
  const { listUsername, viewProfile, setView, user: me } = useApp();
  const { toast } = useToast();
  const [users, setUsers] = useState<AuraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!listUsername) return;
    let cancelled = false;
    const fn = mode === "followers" ? aura.followers : aura.following;
    fn(listUsername)
      .then((r) => {
        if (cancelled) return;
        setUsers(r.users);
        // if I'm in the list, precompute who I follow
        if (me) {
          aura
            .following(me.username)
            .then((mine) => !cancelled && setFollowingIds(new Set(mine.users.map((u) => u.id))))
            .catch(() => {});
        }
      })
      .catch((e) => !cancelled && toast({ title: "Couldn't load", description: e.message, variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [listUsername, mode, me, toast]);

  const follow = async (u: AuraUser) => {
    try {
      const r = await aura.follow(u.username);
      setFollowingIds((s) => {
        const n = new Set(s);
        if (r.following) n.add(u.id);
        else n.delete(u.id);
        return n;
      });
    } catch (e: any) {
      toast({ title: "Couldn't follow", description: e.message, variant: "destructive" });
    }
  };

  const title = mode === "followers" ? "Followers" : "Following";

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <button
        onClick={() => listUsername && viewProfile(listUsername)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to @{listUsername}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center aura-glow">
          <Users className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} {title.toLowerCase()} {mode === "followers" ? "of" : "followed by"} @{listUsername}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : users.length === 0 ? (
        <div className="aura-card rounded-2xl border border-white/5 p-10 text-center">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-sm text-muted-foreground">
            {mode === "followers"
              ? "No followers yet. The grind is just getting started."
              : "Not following anyone yet. Go discover some grinders!"}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {users.map((u, i) => {
            const isFollowing = followingIds.has(u.id);
            const isMe = me?.id === u.id;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="aura-card rounded-2xl border border-white/5 p-4 flex items-center gap-3"
              >
                <Avatar
                  username={u.username}
                  avatarUrl={u.avatarUrl}
                  avatarColor={u.avatarColor}
                  isVerified={u.isVerified}
                  size="md"
                  onClick={() => viewProfile(u.username)}
                />
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => viewProfile(u.username)}
                    className="flex items-center gap-1 font-semibold hover:underline truncate"
                  >
                    <span className="truncate">{u.username}</span>
                    {u.isVerified && (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 verified-badge shrink-0">
                        <path fill="oklch(0.78 0.2 60)" d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8L3.2 16l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 1.5z" />
                        <path fill="oklch(0.13 0.02 290)" d="M10.6 14.6l-2.3-2.3 1.4-1.4 1 1 3.2-3.2 1.4 1.4-4.7 4.5z" />
                      </svg>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatNumber(u.followerCount ?? 0)} followers · {u.postCount ?? 0} posts
                  </p>
                </div>
                {!isMe && (
                  <Button
                    size="sm"
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={() => follow(u)}
                    className={isFollowing ? "" : "aura-gradient-bg text-white hover:opacity-90"}
                  >
                    {isFollowing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
