"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, Heart, MessageCircle, Repeat2, Loader2 } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { RichText } from "./RichText";
import { categoryMeta } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: "like" | "comment" | "repost";
  createdAt: string;
  content?: string;
  post: { id: string; caption: string; category: string; createdAt: string; author: any };
  repostOf?: any;
}

export function ActivityView() {
  const { viewProfile, viewPostDetail, setSearchQuery, setView } = useApp();
  const { toast } = useToast();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    aura
      .activity()
      .then((r) => !cancelled && setItems(r.activity))
      .catch((e) => !cancelled && toast({ title: "Couldn't load activity", description: e.message, variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const icon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-rose-400 fill-rose-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-sky-400" />;
      case "repost":
        return <Repeat2 className="h-4 w-4 text-emerald-400" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const label = (type: string) => {
    switch (type) {
      case "like":
        return "liked a flex by";
      case "comment":
        return "commented on";
      case "repost":
        return "reposted";
      default:
        return "interacted with";
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center aura-glow">
          <Activity className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Your Activity</h1>
          <p className="text-sm text-muted-foreground">Everything you&rsquo;ve liked, commented & reposted.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="aura-card rounded-2xl border border-border p-10 text-center">
          <div className="text-5xl mb-3 aura-float">📊</div>
          <h3 className="font-semibold text-lg">No activity yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start liking, commenting, and reposting to build your activity timeline.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => {
            const cat = categoryMeta(item.post.category);
            return (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="aura-card rounded-2xl border border-border p-3 flex items-start gap-3"
              >
                <div className="relative shrink-0">
                  <Avatar
                    username={item.post.author.username}
                    avatarUrl={item.post.author.avatarUrl}
                    avatarColor={item.post.author.avatarColor}
                    isVerified={item.post.author.isVerified}
                    size="md"
                    onClick={() => viewProfile(item.post.author.username)}
                  />
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1 ring-1 ring-white/10">
                    {icon(item.type)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-relaxed">
                    <span className="text-muted-foreground">You {label(item.type)} </span>
                    <button
                      onClick={() => viewProfile(item.post.author.username)}
                      className="font-semibold hover:underline"
                    >
                      @{item.post.author.username}
                    </button>
                  </p>
                  {item.type === "comment" && item.content && (
                    <p className="text-sm mt-1 text-foreground/80 italic">
                      &ldquo;{item.content}&rdquo;
                    </p>
                  )}
                  {item.type === "repost" && item.content && (
                    <p className="text-sm mt-1 text-foreground/80 italic">
                      &ldquo;{item.content}&rdquo;
                    </p>
                  )}
                  <button
                    onClick={() => viewPostDetail(item.post.id)}
                    className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition text-left"
                  >
                    <span className={cn("inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-1.5 py-0.5 text-white/90", cat.color)}>
                      {cat.emoji}
                    </span>
                    <span className="truncate">{item.post.caption.slice(0, 60)}{item.post.caption.length > 60 ? "…" : ""}</span>
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(item.createdAt)} ago</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
