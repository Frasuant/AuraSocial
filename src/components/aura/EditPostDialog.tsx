"use client";

import { useState, useEffect } from "react";
import { ImagePlus, Loader2, ShieldCheck, X, Pencil } from "lucide-react";
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

export function EditPostDialog() {
  const { editPostOpen, closeEditPost, editingPostId, editingInitial, bumpFeed } = useApp();
  const { toast } = useToast();
  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("flex");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync local state when the dialog opens with new initial values
  useEffect(() => {
    if (editPostOpen && editingInitial) {
      setCaption(editingInitial.caption);
      setCategory(editingInitial.category);
      setImageUrl(editingInitial.imageUrl);
    }
  }, [editPostOpen, editingInitial]);

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
    if (!caption.trim() || saving || !editingPostId) return;
    setSaving(true);
    try {
      const r = await aura.editPost(editingPostId, {
        caption: caption.trim(),
        category,
        imageUrl,
      });
      const m: ModerationResult = r.moderation;
      if (m.approved) {
        toast({
          title: "Updated ✨",
          description: m.summary || "Your flex is updated and live.",
        });
      } else {
        toast({
          title: "Held for review",
          description: `AuraGuard flagged the edit: ${m.note || m.summary}`,
          variant: "destructive",
        });
      }
      bumpFeed();
      closeEditPost();
    } catch (e: any) {
      toast({ title: "Couldn't save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const cat = categoryMeta(category);

  return (
    <Dialog open={editPostOpen} onOpenChange={(o) => !o && closeEditPost()}>
      <DialogContent className="max-w-lg bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-amber-300" />
            <span className="aura-gradient-text">Edit Flex</span>
          </DialogTitle>
          <DialogDescription>
            Update your caption, category, or photo. AuraGuard re-scans on save.
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
              Editing re-runs <b className="text-foreground">AuraGuard AI</b>. If the new caption is
              clean, a previously-flagged post gets re-published.
            </span>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={closeEditPost} className="flex-1" disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!caption.trim() || saving || uploading}
              className="flex-1 aura-gradient-bg text-white hover:opacity-90"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1" /> Saving…
                </>
              ) : (
                `Save ${cat.emoji}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
