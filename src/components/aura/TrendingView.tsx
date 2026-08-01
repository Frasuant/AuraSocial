"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Loader2, Trophy } from "lucide-react";
import { aura } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";

export function TrendingView() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aura
      .trending()
      .then((r) => setPosts(r.posts))
      .catch((e) => toast({ title: "Couldn't load trending", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center aura-glow">
          <Flame className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Trending
          </h1>
          <p className="text-sm text-muted-foreground">
            Top flexes from the last 7 days, ranked by hype.
          </p>
        </div>
      </div>

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
              <div className="mt-3 h-20 rounded-xl bg-muted/30 aura-shimmer" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="aura-card rounded-2xl border border-border p-10 text-center">
          <div className="text-5xl mb-3 aura-float">🏆</div>
          <h3 className="font-semibold text-lg">No trending posts yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Posts from the last 7 days with the most likes, comments & saves will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((p, i) => (
            <div key={p.id} className="relative">
              {i < 3 && (
                <div className="absolute -left-1 -top-2 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
                  <Trophy className="h-3 w-3" /> #{i + 1}
                </div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.25) }}
              >
                <PostCard post={p} />
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
