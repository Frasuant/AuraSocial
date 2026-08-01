"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, Loader2 } from "lucide-react";
import { aura } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";

export function BookmarksView() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    aura
      .bookmarks()
      .then((r) => !cancelled && setPosts(r.posts))
      .catch((e) => !cancelled && toast({ title: "Couldn't load saved", description: e.message, variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [toast]);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center aura-glow">
          <Bookmark className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Saved</h1>
          <p className="text-sm text-muted-foreground">Posts you&rsquo;ve bookmarked for later.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="aura-card rounded-2xl border border-border p-10 text-center">
          <div className="text-5xl mb-3 aura-float">🔖</div>
          <h3 className="font-semibold text-lg">No saved posts yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tap the bookmark icon on any post to save it here for later.
          </p>
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
        </div>
      )}
    </div>
  );
}
