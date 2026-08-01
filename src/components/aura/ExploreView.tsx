"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus, Check } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNumber } from "@/lib/utils";
import type { AuraUser } from "@/lib/types";

export function ExploreView() {
  const { viewProfile } = useApp();
  const { toast } = useToast();
  const [users, setUsers] = useState<AuraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    aura
      .explore()
      .then((r) => setUsers(r.users))
      .catch((e) => toast({ title: "Couldn't load", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(query.toLowerCase())
  );

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

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="text-sm text-muted-foreground">Find grinders worth following.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username…"
          className="pl-9 bg-white/5 border-white/10"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="aura-card rounded-2xl border border-white/5 p-10 text-center text-sm text-muted-foreground">
          {query ? "No users match your search." : "No users to show right now."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {filtered.map((u) => {
            const isFollowing = followingIds.has(u.id);
            return (
              <div
                key={u.id}
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
                    {u.followerCount ? `${formatNumber(u.followerCount)} followers` : "New here"} · {u.postCount ?? 0} posts
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={isFollowing ? "secondary" : "default"}
                  onClick={() => follow(u)}
                  className={isFollowing ? "" : "aura-gradient-bg text-white hover:opacity-90"}
                >
                  {isFollowing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
