"use client";

import { useState } from "react";
import { Loader2, ImagePlus, Check, X } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { AVATAR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const colorMap: Record<string, string> = {
  violet: "from-violet-500 to-fuchsia-500",
  rose: "from-rose-500 to-pink-500",
  amber: "from-amber-500 to-orange-500",
  emerald: "from-emerald-500 to-teal-500",
  sky: "from-sky-500 to-cyan-500",
  fuchsia: "from-fuchsia-500 to-purple-500",
  orange: "from-orange-500 to-red-500",
  teal: "from-teal-500 to-emerald-500",
};

export function EditProfileDialog() {
  const { editProfileOpen, setEditProfileOpen, user, setUser } = useApp();
  const { toast } = useToast();
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || "violet");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync local state when opening
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setBio(user?.bio || "");
      setAvatarColor(user?.avatarColor || "violet");
      setAvatarUrl(user?.avatarUrl || "");
    }
    setEditProfileOpen(open);
  };

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const r = await aura.upload(file);
      setAvatarUrl(r.url);
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await aura.updateProfile({
        bio,
        avatarColor,
        avatarUrl,
      });
      setUser(r.user);
      toast({ title: "Profile updated ✨", description: "Your vibe is locked in." });
      setEditProfileOpen(false);
    } catch (e: any) {
      toast({ title: "Couldn't save", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={editProfileOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="aura-gradient-text">Edit profile</DialogTitle>
          <DialogDescription>
            Update your bio, avatar color, or upload a profile photo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Preview */}
          <div className="flex justify-center">
            <Avatar
              username={user?.username || "?"}
              avatarUrl={avatarUrl}
              avatarColor={avatarColor}
              isVerified={user?.isVerified}
              size="xl"
              showBadge={false}
            />
          </div>

          {/* Avatar photo */}
          <div>
            <Label className="text-xs text-muted-foreground">Profile photo</Label>
            {avatarUrl ? (
              <div className="relative mt-1.5 rounded-xl overflow-hidden border border-border">
                <img src={avatarUrl} alt="" className="h-24 w-full object-cover" />
                <button
                  onClick={() => setAvatarUrl("")}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 hover:bg-black/80"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="mt-1.5 flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/30 py-5 cursor-pointer hover:bg-muted/50 transition">
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">
                  {uploading ? "Uploading…" : "Upload photo"}
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
          </div>

          {/* Avatar color */}
          <div>
            <Label className="text-xs text-muted-foreground">Avatar gradient color</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setAvatarColor(c)}
                  className={cn(
                    "h-9 w-9 rounded-full bg-gradient-to-br ring-2 transition",
                    colorMap[c],
                    avatarColor === c ? "ring-white scale-110" : "ring-transparent hover:ring-white/30"
                  )}
                  aria-label={c}
                >
                  {avatarColor === c && <Check className="h-4 w-4 text-white mx-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio" className="text-xs text-muted-foreground">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="What's your grind about?"
              className="mt-1.5 min-h-[80px] resize-none bg-muted/30 border-border"
              maxLength={200}
            />
            <div className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/200</div>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditProfileOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={save} disabled={saving || uploading} className="flex-1 aura-gradient-bg text-white hover:opacity-90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
