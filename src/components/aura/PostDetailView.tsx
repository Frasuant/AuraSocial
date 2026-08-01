"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Repeat2 } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { PostCard } from "./PostCard";
import { RichText } from "./RichText";
import { Avatar } from "./Avatar";
import { categoryMeta } from "@/lib/constants";
import { cn, timeAgo } from "@/lib/utils";
import type { Post, Comment } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function PostDetailView() {
  const { postDetailId, setView, viewProfile, setSearchQuery } = useApp();
  const { toast } = useToast();
  const [post, setPost] = useState<(Post & { bookmarkCount: number; repostCount: number; repostOf: any }) | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!postDetailId) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      aura.postDetail(postDetailId),
      aura.comments(postDetailId).catch(() => ({ comments: [] })),
    ])
      .then(([detail, commentsRes]) => {
        if (cancelled) return;
        setPost(detail.post);
        setComments(commentsRes.comments || []);
      })
      .catch((e) => !cancelled && toast({ title: "Couldn't load post", description: e.message, variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [postDetailId, toast]);

  const submitComment = async () => {
    if (!commentText.trim() || !postDetailId || posting) return;
    setPosting(true);
    try {
      const r = await aura.comment(postDetailId, commentText.trim());
      setComments((c) => [...c, r.comment]);
      setCommentText("");
    } catch (e: any) {
      toast({ title: "Comment failed", description: e.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center text-muted-foreground">
        Post not found.
      </div>
    );
  }

  const cat = categoryMeta(post.category);

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <button
        onClick={() => setView("feed")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </button>

      {/* Repost banner */}
      {post.repostOf && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
          <Repeat2 className="h-4 w-4" />
          <span>
            Reposted from{" "}
            <button
              onClick={() => post.repostOf && viewProfile(post.repostOf.author.username)}
              className="font-semibold hover:underline"
            >
              @{post.repostOf.author.username}
            </button>
          </span>
        </div>
      )}

      {/* The post */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <PostCard post={post} onOpen={() => {}} />
      </motion.div>

      {/* Original post (if this is a repost) */}
      {post.repostOf && (
        <div className="ml-4 border-l-2 border-white/10 pl-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <Repeat2 className="h-3 w-3" /> Original post by @{post.repostOf.author.username}
          </p>
          <div className="aura-card rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar
                username={post.repostOf.author.username}
                avatarUrl={post.repostOf.author.avatarUrl}
                avatarColor={post.repostOf.author.avatarColor}
                isVerified={post.repostOf.author.isVerified}
                size="sm"
                onClick={() => viewProfile(post.repostOf.author.username)}
              />
              <button
                onClick={() => viewProfile(post.repostOf.author.username)}
                className="font-semibold text-sm hover:underline"
              >
                {post.repostOf.author.username}
              </button>
              <span className="text-xs text-muted-foreground">· {timeAgo(post.repostOf.createdAt)}</span>
              <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-xs text-white/90", cat.color)}>
                {cat.emoji} {cat.label}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap break-words">
              <RichText
                text={post.repostOf.caption}
                onMention={(username) => viewProfile(username)}
                onHashtag={(tag) => { setSearchQuery(`#${tag}`); setView("explore"); }}
              />
            </p>
            {post.repostOf.imageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden">
                <img src={post.repostOf.imageUrl} alt="" className="w-full max-h-60 object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Extra stats */}
      <div className="aura-card rounded-2xl border border-white/5 p-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold tabular-nums">{post.likeCount}</p>
          <p className="text-xs text-muted-foreground">Likes</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums">{post.repostCount}</p>
          <p className="text-xs text-muted-foreground">Reposts</p>
        </div>
        <div>
          <p className="text-lg font-bold tabular-nums">{post.bookmarkCount}</p>
          <p className="text-xs text-muted-foreground">Saves</p>
        </div>
      </div>

      {/* All comments */}
      <div className="space-y-3">
        <h3 className="px-1 text-sm font-semibold text-muted-foreground">
          {comments.length} comment{comments.length !== 1 ? "s" : ""}
        </h3>
        {comments.length === 0 && (
          <div className="aura-card rounded-2xl border border-white/5 p-8 text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm text-muted-foreground">No comments yet. Start the conversation.</p>
          </div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="aura-card rounded-2xl border border-white/5 p-3 flex gap-2.5">
            <Avatar
              username={c.user.username}
              avatarUrl={c.user.avatarUrl}
              avatarColor={c.user.avatarColor}
              isVerified={c.user.isVerified}
              size="sm"
              onClick={() => viewProfile(c.user.username)}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => viewProfile(c.user.username)}
                  className="font-semibold text-sm hover:underline"
                >
                  {c.user.username}
                </button>
                <span className="text-xs text-muted-foreground">· {timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">
                <RichText
                  text={c.content}
                  onMention={(username) => viewProfile(username)}
                  onHashtag={(tag) => { setSearchQuery(`#${tag}`); setView("explore"); }}
                />
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Comment composer */}
      <div className="flex gap-2">
        <Textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment…"
          className="min-h-[44px] resize-none bg-white/5 border-white/10"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submitComment();
            }
          }}
        />
        <Button
          onClick={submitComment}
          disabled={!commentText.trim() || posting}
          className="aura-gradient-bg text-white hover:opacity-90"
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
        </Button>
      </div>
    </div>
  );
}
