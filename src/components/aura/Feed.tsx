"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, TrendingUp, Flame } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { POST_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";
import type { Post } from "@/lib/types";

export function Feed() {
  const { user, setCreateOpen, setView, feedKey } = useApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [category, setCategory] = useState<string>("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await aura.feed({ category: category || undefined });
      setPosts(r.posts);
      setCursor(r.nextCursor);
      setHasMore(!!r.nextCursor);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    load();
  }, [load, feedKey]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const r = await aura.feed({ category: category || undefined, cursor });
      setPosts((p) => [...p, ...r.posts]);
      setCursor(r.nextCursor);
      setHasMore(!!r.nextCursor);
    } catch (e) {
      // ignore
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Page heading */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-400" /> The Feed
          </h1>
          <p className="text-sm text-muted-foreground">Real wins from real grinders.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setView("discovery")}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300 hover:bg-violet-500/15 transition"
          >
            <Sparkles className="h-3.5 w-3.5" /> Discover
          </button>
          <button
            onClick={() => setView("trending")}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 hover:bg-orange-500/15 transition"
          >
            <Flame className="h-3.5 w-3.5" /> Trending
          </button>
        </div>
      </div>

      {/* Compose */}
      <button
        onClick={() => setCreateOpen(true)}
        className="aura-card w-full rounded-2xl border border-border p-4 flex items-center gap-3 text-left hover:border-primary/30 transition"
      >
        <div className="aura-gradient-bg h-10 w-10 rounded-full flex items-center justify-center text-white font-bold">
          {(user?.username || "?").charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 text-muted-foreground">Share a new flex or goal…</span>
        <Sparkles className="h-4 w-4 text-amber-300" />
      </button>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setCategory("")}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition border",
            category === ""
              ? "aura-gradient-bg text-white border-transparent"
              : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
          )}
        >
          🔥 All
        </button>
        {POST_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition border",
              category === c.value
                ? "aura-gradient-bg text-white border-transparent"
                : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
            )}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aura-card rounded-2xl border border-border p-4">
              <div className="flex gap-3">
                <div className="h-11 w-11 rounded-full bg-muted/30 aura-shimmer" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-muted/30 aura-shimmer" />
                  <div className="h-3 w-16 rounded bg-muted/30 aura-shimmer" />
                </div>
              </div>
              <div className="mt-3 h-40 rounded-xl bg-muted/30 aura-shimmer" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="aura-card rounded-2xl border border-border p-10 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h3 className="font-semibold text-lg">No flexes here yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Be the first to post in this category. Drop your win.
          </p>
          <Button
            onClick={() => setCreateOpen(true)}
            className="mt-4 aura-gradient-bg text-white hover:opacity-90"
          >
            Create a post
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.25) }}
            >
              <PostCard post={p} />
            </motion.div>
          ))}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
