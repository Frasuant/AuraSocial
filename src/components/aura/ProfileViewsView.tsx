"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Loader2, UserPlus, Check } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/button";
import { formatNumber, timeAgo } from "@/lib/utils";
import type { AuraUser } from "@/lib/types";

interface Viewer extends AuraUser {
  viewedAt: string;
}

export function ProfileViewsView() {
  const { viewProfile } = useApp();
  const { toast } = useToast();
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    aura
      .profileViews()
      .then((r) => {
        if (cancelled) return;
        setViewers(r.viewers as Viewer[]);
        setTotalViews(r.totalViews);
      })
      .catch((e) => !cancelled && toast({ title: "Couldn't load profile views", description: e.message, variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const follow = async (u: Viewer) => {
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

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center aura-glow">
          <Eye className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Profile Views</h1>
          <p className="text-sm text-muted-foreground">
            {totalViews > 0 ? `${totalViews} grinders checked your profile.` : "See who's been checking your flex."}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : viewers.length === 0 ? (
        <div className="aura-card rounded-2xl border border-border p-10 text-center">
          <div className="text-5xl mb-3 aura-float">👀</div>
          <h3 className="font-semibold text-lg">No views yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            When other grinders visit your profile, they&rsquo;ll show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {viewers.map((v, i) => {
            const isFollowing = followingIds.has(v.id);
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="aura-card rounded-2xl border border-border p-4 flex items-center gap-3"
              >
                <Avatar
                  username={v.username}
                  avatarUrl={v.avatarUrl}
                  avatarColor={v.avatarColor}
                  isVerified={v.isVerified}
                  size="md"
                  onClick={() => viewProfile(v.username)}
                />
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => viewProfile(v.username)}
                    className="flex items-center gap-1 font-semibold hover:underline truncate"
                  >
                    <span className="truncate">{v.username}</span>
                    {v.isVerified && (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 verified-badge shrink-0">
                        <path fill="oklch(0.55 0.22 264)" d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8L3.2 16l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 1.5z" />
                        <path fill="white" d="M10.6 14.6l-2.3-2.3 1.4-1.4 1 1 3.2-3.2 1.4 1.4-4.7 4.5z" />
                      </svg>
                    )}
                  </button>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatNumber(v.followerCount ?? 0)} followers · {v.postCount ?? 0} posts
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">viewed {timeAgo(v.viewedAt)} ago</p>
                </div>
                <Button
                  size="sm"
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={() => follow(v)}
                  className={isFollowing ? "" : "aura-gradient-bg text-white hover:opacity-90"}
                >
                  {isFollowing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
