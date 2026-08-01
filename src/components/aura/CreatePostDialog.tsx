"use client";

import { useState } from "react";
import { ImagePlus, Loader2, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { POST_CATEGORIES, categoryMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ModerationResult } from "@/lib/types";

export function CreatePostDialog() {
  const { createOpen, setCreateOpen, user, setView, bumpFeed } = useApp();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("flex");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);

  const reset = () => {
    setCaption("");
    setCategory("flex");
    setImageUrl("");
  };

  const close = () => {
    setCreateOpen(false);
    reset();
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const r = await aura.upload(file);
      setImageUrl(r.url);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!caption.trim() || posting) return;
    setPosting(true);
    try {
      const r = await aura.createPost({ caption: caption.trim(), category, imageUrl });
      const m: ModerationResult = r.moderation;
      if (m.approved) {
        toast({
          title: "Posted! 🔥",
          description: m.summary || "Your flex is live.",
        });
      } else {
        toast({
          title: "Held for review",
          description: `AuraGuard flagged this: ${m.note || m.summary}`,
          variant: "destructive",
        });
      }
      bumpFeed();
      close();
    } catch (e: any) {
      toast({ title: "Couldn't post", description: e.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const cat = categoryMeta(category);

  return (
    <Dialog open={createOpen} onOpenChange={(o) => (o ? setCreateOpen(true) : close())}>
      <DialogContent className="max-w-lg bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="aura-gradient-text">New Flex</span>
          </DialogTitle>
          <DialogDescription>
            Post a goal, a win, or a flex. AuraGuard AI checks every post before it goes live.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {POST_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium border transition",
                    category === c.value
                      ? "aura-gradient-bg text-white border-transparent"
                      : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption */}
          <div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={`What are you flexing today, ${user?.username}?`}
              className="min-h-[120px] resize-none bg-white/5 border-white/10"
              maxLength={2000}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {caption.length}/2000
            </div>
          </div>

          {/* Image */}
          {imageUrl ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10">
              <img src={imageUrl} alt="" className="w-full max-h-72 object-cover" />
              <button
                onClick={() => setImageUrl("")}
                className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 py-8 cursor-pointer hover:bg-white/10 transition">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {uploading ? "Uploading…" : "Add a photo (optional)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                }}
              />
            </label>
          )}

          {/* AuraGuard notice */}
          <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>
              <b className="text-foreground">AuraGuard AI</b> scans every post for scams, illegal
              content, hate, spam & impersonation. Safe posts go live instantly; sketchy ones are
              held for Admin review.
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={close} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!caption.trim() || posting || uploading}
              className="flex-1 aura-gradient-bg text-white hover:opacity-90"
            >
              {posting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Scanning…
                </>
              ) : (
                `Post ${cat.emoji}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
