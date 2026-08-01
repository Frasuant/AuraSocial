"use client";

import { useState } from "react";
import { Heart, MessageCircle, Share2, Flag, Trash2 } from "lucide-react";
import { Avatar } from "./Avatar";
import { categoryMeta } from "@/lib/constants";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { cn, timeAgo, formatNumber } from "@/lib/utils";
import type { Post, Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PostCard({ post }: { post: Post }) {
  const { user, viewProfile, bumpFeed } = useApp();
  const { toast } = useToast();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [optimistic, setOptimistic] = useState(false);
  const cat = categoryMeta(post.category);

  const toggleLike = async () => {
    if (!user) {
      toast({ title: "Log in to like posts", variant: "destructive" });
      return;
    }
    setOptimistic(true);
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? prevCount - 1 : prevCount + 1);
    try {
      await aura.like(post.id);
    } catch (e: any) {
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast({ title: "Couldn't update like", description: e.message, variant: "destructive" });
    } finally {
      setOptimistic(false);
    }
  };

  const loadComments = async () => {
    try {
      const r = await aura.comments(post.id);
      setComments(r.comments);
    } catch (e: any) {
      toast({ title: "Couldn't load comments", description: e.message, variant: "destructive" });
    }
  };

  const toggleComments = () => {
    if (!showComments && comments.length === 0) loadComments();
    setShowComments((v) => !v);
  };

  const submitComment = async () => {
    if (!commentText.trim() || posting) return;
    setPosting(true);
    try {
      const r = await aura.comment(post.id, commentText.trim());
      setComments((c) => [...c, r.comment]);
      setCommentText("");
      bumpFeed();
    } catch (e: any) {
      toast({ title: "Comment failed", description: e.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const share = async () => {
    const text = `${post.caption.slice(0, 80)} — via AuraMedia by @${post.author?.username}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AuraMedia", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copied to clipboard", description: "Share the flex! 🔥" });
      }
    } catch {
      /* dismissed */
    }
  };

  const isFlagged = post.status === "flagged";

  return (
    <article className="aura-card rounded-2xl border border-white/5 overflow-hidden shadow-lg shadow-black/20">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <Avatar
          username={post.author?.username || "?"}
          avatarUrl={post.author?.avatarUrl}
          avatarColor={post.author?.avatarColor}
          isVerified={post.author?.isVerified}
          isAdmin={post.author?.isAdmin}
          size="md"
          onClick={() => post.author && viewProfile(post.author.username)}
        />
        <div className="min-w-0 flex-1">
          <button
            onClick={() => post.author && viewProfile(post.author.username)}
            className="flex items-center gap-1 font-semibold hover:underline truncate"
          >
            <span className="truncate">{post.author?.username}</span>
            {post.author?.isVerified && (
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 verified-badge">
                <path
                  fill="oklch(0.78 0.2 60)"
                  d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8L3.2 16l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 1.5z"
                />
                <path fill="oklch(0.13 0.02 290)" d="M10.6 14.6l-2.3-2.3 1.4-1.4 1 1 3.2-3.2 1.4 1.4-4.7 4.5z" />
              </svg>
            )}
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-white/90", cat.color)}>
              <span>{cat.emoji}</span>
              <span className="font-medium">{cat.label}</span>
            </span>
            <span>· {timeAgo(post.createdAt)}</span>
          </div>
        </div>
        {isFlagged && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-500/30">
            <Flag className="h-3 w-3" /> Under review
          </span>
        )}
      </div>

      {/* Image */}
      {post.imageUrl && (
        <div className={cn("relative aspect-[4/3] w-full bg-gradient-to-br", cat.color)}>
          <img src={post.imageUrl} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
      )}

      {/* Caption */}
      <div className="px-4 pt-3">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
          {post.caption}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          onClick={toggleLike}
          disabled={optimistic}
          className={cn(
            "group flex items-center gap-2 rounded-full px-3 py-2 text-sm transition active:scale-95",
            liked ? "text-rose-400" : "text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
          )}
        >
          <Heart className={cn("h-5 w-5 transition", liked && "fill-rose-500 scale-110")} />
          <span className="font-medium">{formatNumber(likeCount)}</span>
        </button>
        <button
          onClick={toggleComments}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:text-sky-300 hover:bg-sky-500/10 active:scale-95"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">{formatNumber(post.commentCount)}</span>
        </button>
        <button
          onClick={share}
          className="flex items-center gap-2 rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-95"
        >
          <Share2 className="h-5 w-5" />
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="border-t border-white/5 bg-black/20 px-4 py-3 space-y-3">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet — be the first to hype this flex.</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar
                username={c.user.username}
                avatarUrl={c.user.avatarUrl}
                avatarColor={c.user.avatarColor}
                isVerified={c.user.isVerified}
                size="xs"
                onClick={() => viewProfile(c.user.username)}
              />
              <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-white/5 px-3 py-2">
                  <button
                    onClick={() => viewProfile(c.user.username)}
                    className="mr-1.5 text-sm font-semibold hover:underline"
                  >
                    {c.user.username}
                  </button>
                  <span className="text-sm">{c.content}</span>
                </div>
                <span className="ml-3 text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
              </div>
            </div>
          ))}
          {user && (
            <div className="flex gap-2.5 pt-1">
              <Avatar
                username={user.username}
                avatarUrl={user.avatarUrl}
                avatarColor={user.avatarColor}
                isVerified={user.isVerified}
                size="xs"
                showBadge={false}
              />
              <div className="flex-1 flex gap-2">
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  className="min-h-[40px] resize-none bg-white/5 border-white/10"
                  rows={1}
                />
                <Button
                  size="sm"
                  onClick={submitComment}
                  disabled={!commentText.trim() || posting}
                  className="aura-gradient-bg text-white hover:opacity-90"
                >
                  Post
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
