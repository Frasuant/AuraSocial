"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FileEdit, Loader2, Pencil, Trash2, Send } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { categoryMeta } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Post } from "@/lib/types";

export function DraftsView() {
  const { user, openEditPost, bumpFeed } = useApp();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    aura
      .drafts()
      .then((r) => setDrafts(r.posts))
      .catch((e) => toast({ title: "Couldn't load drafts", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const publish = async (draft: Post) => {
    if (!draft.caption.trim()) {
      toast({ title: "Add a caption first", variant: "destructive" });
      openEditPost(draft.id, { caption: draft.caption, category: draft.category, imageUrl: draft.imageUrl });
      return;
    }
    setBusy(draft.id);
    try {
      const r = await aura.editPost(draft.id, {
        caption: draft.caption,
        category: draft.category,
        images: draft.images || [],
        publish: true,
      });
      if (r.moderation.approved) {
        toast({ title: "Published! 🔥", description: "Your draft is now live." });
      } else {
        toast({ title: "Held for review", description: `AuraGuard: ${r.moderation.note}`, variant: "destructive" });
      }
      setDrafts((list) => list.filter((d) => d.id !== draft.id));
      bumpFeed();
    } catch (e: any) {
      toast({ title: "Couldn't publish", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (draft: Post) => {
    setBusy(draft.id);
    try {
      await aura.deletePost(draft.id);
      setDrafts((list) => list.filter((d) => d.id !== draft.id));
      toast({ title: "Draft deleted" });
    } catch (e: any) {
      toast({ title: "Couldn't delete", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center aura-glow">
          <FileEdit className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Drafts</h1>
          <p className="text-sm text-muted-foreground">Work-in-progress flexes. Finish them when you&rsquo;re ready.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="aura-card rounded-2xl border border-white/5 p-10 text-center">
          <div className="text-5xl mb-3 aura-float">📝</div>
          <h3 className="font-semibold text-lg">No drafts</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Start writing a post and tap &ldquo;Save draft&rdquo; to come back to it later.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((d, i) => {
            const cat = categoryMeta(d.category);
            return (
              <motion.div
                key={d.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="aura-card rounded-2xl border border-white/5 p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    username={user?.username || "?"}
                    avatarUrl={user?.avatarUrl}
                    avatarColor={user?.avatarColor}
                    isVerified={user?.isVerified}
                    size="sm"
                    showBadge={false}
                  />
                  <span className="font-semibold text-sm">{user?.username}</span>
                  <span className="text-xs text-muted-foreground">· edited {timeAgo(d.updatedAt)} ago</span>
                  <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-xs text-white/90", cat.color)}>
                    {cat.emoji} {cat.label}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words mb-3 line-clamp-3">
                  {d.caption || <span className="text-muted-foreground italic">Empty caption — tap edit to add one</span>}
                </p>
                {d.images && d.images.length > 0 && (
                  <div className="flex gap-1.5 mb-3">
                    {d.images.slice(0, 4).map((img, idx) => (
                      <div key={idx} className="h-12 w-12 rounded-lg overflow-hidden border border-white/10">
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                    {d.images.length > 4 && (
                      <div className="h-12 w-12 rounded-lg border border-white/10 flex items-center justify-center text-xs text-muted-foreground">
                        +{d.images.length - 4}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => openEditPost(d.id, { caption: d.caption, category: d.category, imageUrl: d.imageUrl })}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => publish(d)}
                    disabled={busy === d.id}
                    className="aura-gradient-bg text-white hover:opacity-90"
                  >
                    {busy === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5 mr-1.5" />}
                    Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(d)}
                    disabled={busy === d.id}
                    className="ml-auto text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
