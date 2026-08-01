"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, UserMinus, UserPlus, Loader2, Pencil, LogOut, Heart, Grid3x3 } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import type { AuraUser, Post } from "@/lib/types";

export function ProfileView() {
  const { profileUsername, user: me, setView, setUser, setEditProfileOpen, viewFollowers, viewFollowing } = useApp();
  const { toast } = useToast();
  const [profile, setProfile] = useState<AuraUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [likedLoading, setLikedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!profileUsername) return;
    let cancelled = false;
    setLoading(true);
    aura
      .profile(profileUsername)
      .then((r) => {
        if (cancelled) return;
        setProfile(r.user);
        setPosts(r.posts);
      })
      .catch((e) => !cancelled && toast({ title: "Couldn't load profile", description: e.message, variant: "destructive" }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [profileUsername, toast]);

  const loadLiked = async () => {
    if (!profileUsername || likedLoading) return;
    setLikedLoading(true);
    try {
      const r = await aura.userLikes(profileUsername);
      setLikedPosts(r.posts);
    } catch (e: any) {
      toast({ title: "Couldn't load liked posts", description: e.message, variant: "destructive" });
    } finally {
      setLikedLoading(false);
    }
  };

  const follow = async () => {
    if (!me || !profile) return;
    setFollowLoading(true);
    const prev = profile.isFollowing;
    setProfile({ ...profile, isFollowing: !prev, followerCount: prev ? profile.followerCount! - 1 : profile.followerCount! + 1 });
    try {
      await aura.follow(profile.username);
    } catch (e: any) {
      setProfile({ ...profile, isFollowing: prev, followerCount: prev ? profile.followerCount! + 1 : profile.followerCount! - 1 });
      toast({ title: "Couldn't follow", description: e.message, variant: "destructive" });
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center text-muted-foreground">
        User not found.
      </div>
    );
  }

  const isMe = me?.id === profile.id;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <button
        onClick={() => setView("feed")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to feed
      </button>

      {/* Header card */}
      <div className="aura-card rounded-3xl border border-white/10 overflow-hidden">
        <div className="h-28 aura-gradient-bg relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="px-5 pb-5 -mt-12">
          <div className="flex items-end justify-between">
            <Avatar
              username={profile.username}
              avatarUrl={profile.avatarUrl}
              avatarColor={profile.avatarColor}
              isVerified={profile.isVerified}
              isAdmin={profile.isAdmin}
              size="xl"
            />
            <div className="flex gap-2">
              {isMe ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    <Pencil className="h-4 w-4 mr-1.5" /> Edit profile
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      aura.logout().catch(() => {});
                      setUser(null);
                      setView("feed");
                    }}
                    className="hover:bg-rose-500/15 hover:text-rose-300"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={follow}
                  disabled={followLoading}
                  className={
                    profile.isFollowing
                      ? "bg-white/10 text-foreground hover:bg-white/15"
                      : "aura-gradient-bg text-white hover:opacity-90"
                  }
                >
                  {followLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : profile.isFollowing ? (
                    <>
                      <UserMinus className="h-4 w-4 mr-1" /> Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-1" /> Follow
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.username}</h1>
              {profile.isVerified && (
                <svg viewBox="0 0 24 24" className="h-5 w-5 verified-badge">
                  <path fill="oklch(0.78 0.2 60)" d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8L3.2 16l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 1.5z" />
                  <path fill="oklch(0.13 0.02 290)" d="M10.6 14.6l-2.3-2.3 1.4-1.4 1 1 3.2-3.2 1.4 1.4-4.7 4.5z" />
                </svg>
              )}
              {profile.isAdmin && (
                <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
              <CalendarDays className="h-3.5 w-3.5" />
              Joined {timeAgo(profile.createdAt)} ago
            </div>
          </div>

          {profile.bio && (
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/90">{profile.bio}</p>
          )}

          <div className="mt-4 flex gap-6">
            <Stat label="Posts" value={profile.postCount ?? 0} />
            <button
              onClick={() => viewFollowers(profile.username)}
              className="text-left hover:opacity-80 transition"
            >
              <Stat label="Followers" value={profile.followerCount ?? 0} />
            </button>
            <button
              onClick={() => viewFollowing(profile.username)}
              className="text-left hover:opacity-80 transition"
            >
              <Stat label="Following" value={profile.followingCount ?? 0} />
            </button>
          </div>
        </div>
      </div>

      {/* Posts / Liked tabs */}
      <div className="space-y-4">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts">
              <Grid3x3 className="h-4 w-4 mr-1.5" /> Posts
              <span className="ml-1.5 text-xs text-muted-foreground">{posts.length}</span>
            </TabsTrigger>
            <TabsTrigger value="liked" onClick={loadLiked}>
              <Heart className="h-4 w-4 mr-1.5" /> Liked
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-4">
            {posts.length === 0 ? (
              <div className="aura-card rounded-2xl border border-white/5 p-10 text-center">
                <div className="text-4xl mb-2">📸</div>
                <p className="text-sm text-muted-foreground">
                  {isMe ? "You haven't posted yet. Drop your first flex!" : "No posts to show yet."}
                </p>
              </div>
            ) : (
              posts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-4 space-y-4">
            {likedLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : likedPosts.length === 0 ? (
              <div className="aura-card rounded-2xl border border-white/5 p-10 text-center">
                <div className="text-4xl mb-2">💛</div>
                <p className="text-sm text-muted-foreground">
                  {isMe ? "You haven't liked any posts yet. Go hype some flexes!" : "No liked posts to show."}
                </p>
              </div>
            ) : (
              likedPosts.map((p) => <PostCard key={p.id} post={p} />)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-lg font-bold">{formatNumber(value)}</span>{" "}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
