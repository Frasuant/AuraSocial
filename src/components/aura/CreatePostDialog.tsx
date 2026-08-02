"use client";

import { useState, useEffect, useRef } from "react";
import { ImagePlus, Loader2, ShieldCheck, X, Hash, FileEdit } from "lucide-react";
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

const MAX_IMAGES = 6;

export function CreatePostDialog() {
  const { createOpen, setCreateOpen, user, bumpFeed } = useApp();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("flex");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [hashtagSuggestions, setHashtagSuggestions] = useState<{ tag: string; count: number }[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hashtagDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    setCaption("");
    setCategory("flex");
    setImages([]);
    setHashtagSuggestions([]);
    setShowHashtagSuggestions(false);
  };

  const close = () => {
    setCreateOpen(false);
    reset();
  };

  // Sync state when opening
  useEffect(() => {
    if (createOpen) {
      reset();
    }
  }, [createOpen]);

  const onUpload = async (file: File) => {
    if (images.length >= MAX_IMAGES) {
      toast({ title: `Max ${MAX_IMAGES} images`, variant: "destructive" });
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 4MB per image.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const r = await aura.upload(file);
      setImages((prev) => [...prev, r.url]);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  // Hashtag suggestions: detect when the cursor is right after a #word
  useEffect(() => {
    if (hashtagDebounceRef.current) clearTimeout(hashtagDebounceRef.current);
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const text = caption.slice(0, cursor);
    // Find a #hashtag being typed (no space after)
    const match = text.match(/#([a-zA-Z0-9_]*)$/);
    if (!match || match[1].length < 1) {
      setHashtagSuggestions([]);
      setShowHashtagSuggestions(false);
      return;
    }
    const prefix = match[1];
    hashtagDebounceRef.current = setTimeout(async () => {
      try {
        const r = await aura.hashtags(`#${prefix}`);
        // Filter out tags already in the caption
        const existing = new Set(
          (caption.match(/#([a-zA-Z0-9_]+)/g) || []).map((t) => t.slice(1).toLowerCase())
        );
        const filtered = r.tags.filter((t) => !existing.has(t.tag.toLowerCase()));
        setHashtagSuggestions(filtered.slice(0, 5));
        setShowHashtagSuggestions(filtered.length > 0);
      } catch {
        // ignore
      }
    }, 200);
    return () => {
      if (hashtagDebounceRef.current) clearTimeout(hashtagDebounceRef.current);
    };
  }, [caption]);

  const insertHashtag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const text = caption.slice(0, cursor);
    const after = caption.slice(cursor);
    // Replace the #partial at the end with #tag + space
    const newText = text.replace(/#([a-zA-Z0-9_]*)$/, `#${tag} `) + after;
    setCaption(newText);
    setShowHashtagSuggestions(false);
    // Refocus and move cursor
    setTimeout(() => {
      textarea.focus();
      const newPos = text.replace(/#([a-zA-Z0-9_]*)$/, `#${tag} `).length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const submit = async (asDraft = false) => {
    if ((!caption.trim() && !asDraft) || posting) return;
    setPosting(true);
    try {
      const r = await aura.createPost({
        caption: caption.trim(),
        category,
        images,
        imageUrl: images[0] || "",
        draft: asDraft,
      });
      if (asDraft) {
        toast({ title: "Draft saved 📝", description: "Find it in your Drafts to finish later." });
      } else {
        const m: any = r.moderation;
        if (!m.approved) {
          toast({
            title: "Held for review ⚠️",
            description: `AuraGuard: ${m.note || m.summary}`,
            variant: "destructive",
          });
        } else if (m.isFlex === false) {
          toast({
            title: "Posted — but not a flex 🤔",
            description: `This doesn't look like a flex or goal. Flex score: ${m.flexScore}/100. ${m.summary || ""}`,
          });
        } else {
          toast({
            title: "Posted! 🔥",
            description: m.flexScore >= 70 ? `Great flex! Score: ${m.flexScore}/100` : (m.summary || "Your flex is live."),
          });
        }
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
      <DialogContent className="max-w-lg bg-card border-border">
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
                      : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Caption + hashtag suggestions */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onBlur={() => setTimeout(() => setShowHashtagSuggestions(false), 150)}
              placeholder={`What are you flexing today, ${user?.username}? Use #hashtags to get discovered.`}
              className="min-h-[120px] resize-none bg-muted/30 border-border"
              maxLength={2000}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">
              {caption.length}/2000
            </div>

            {/* Hashtag suggestions dropdown */}
            {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
              <div className="absolute z-30 bottom-full left-0 right-0 mb-1 rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
                  Suggested hashtags
                </p>
                {hashtagSuggestions.map((s) => (
                  <button
                    key={s.tag}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertHashtag(s.tag);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition text-left"
                  >
                    <span className="h-7 w-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
                      <Hash className="h-3.5 w-3.5 text-sky-300" />
                    </span>
                    <span className="text-sm font-medium text-sky-300 flex-1">#{s.tag}</span>
                    <span className="text-xs text-muted-foreground">{s.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Images (carousel) */}
          {images.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden border border-border group"
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}
                {images.length < MAX_IMAGES && (
                  <label className="aspect-square rounded-xl border border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted/50 transition">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <ImagePlus className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-[10px] text-muted-foreground">Add</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onUpload(f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {images.length}/{MAX_IMAGES} photos · first image is the cover
              </p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 py-8 cursor-pointer hover:bg-muted/50 transition">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {uploading ? "Uploading…" : "Add photos (up to 6)"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                  e.target.value = "";
                }}
              />
            </label>
          )}

          {/* AuraGuard notice */}
          <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
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
              variant="ghost"
              onClick={() => submit(true)}
              disabled={posting || uploading}
              className="text-muted-foreground hover:text-foreground"
            >
              <FileEdit className="h-4 w-4 mr-1.5" />
              Draft
            </Button>
            <Button
              onClick={() => submit(false)}
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
