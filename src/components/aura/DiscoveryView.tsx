"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Sparkles, Compass } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "./PostCard";
import type { Post } from "@/lib/types";

export function DiscoveryView() {
  const { user } = useApp();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    aura
      .discovery()
      .then((r) => !cancelled && setPosts(r.posts))
      .catch((e) => !cancelled && toast({ title: "Couldn't load discovery", description: e.message, variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [toast]);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center aura-glow">
          <Compass className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Discovery
          </h1>
          <p className="text-sm text-muted-foreground">
            {user
              ? "Posts from people you follow + flexes they've hyped."
              : "Recent flexes from the community. Sign up to personalize."}
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
          <div className="text-5xl mb-3 aura-float">🧭</div>
          <h3 className="font-semibold text-lg">Nothing to discover yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Follow some grinders to see their posts and what they&rsquo;re hyping up.
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
