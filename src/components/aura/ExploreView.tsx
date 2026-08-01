"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2, Search, UserPlus, Check, Hash, X } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { PostCard } from "./PostCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { categoryMeta } from "@/lib/constants";
import { cn, formatNumber, timeAgo } from "@/lib/utils";
import type { AuraUser, Post } from "@/lib/types";

export function ExploreView() {
  const { viewProfile } = useApp();
  const { toast } = useToast();
  const [suggested, setSuggested] = useState<AuraUser[]>([]);
  const [loadingSug, setLoadingSug] = useState(true);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ posts: Post[]; users: AuraUser[] } | null>(null);
  const [searching, setSearching] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [hashtagSuggestions, setHashtagSuggestions] = useState<{ tag: string; count: number }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hashtagDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    aura
      .explore()
      .then((r) => setSuggested(r.users))
      .catch((e) => toast({ title: "Couldn't load", description: e.message, variant: "destructive" }))
      .finally(() => setLoadingSug(false));
  }, [toast]);

  // debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await aura.search(query.trim());
        setSearchResults(r);
      } catch (e: any) {
        toast({ title: "Search failed", description: e.message, variant: "destructive" });
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, toast]);

  // hashtag autocomplete — when the query starts with #, fetch suggestions
  useEffect(() => {
    if (hashtagDebounceRef.current) clearTimeout(hashtagDebounceRef.current);
    const q = query.trim();
    if (!q.startsWith("#")) {
      setHashtagSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    if (q.length < 2) {
      setHashtagSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    hashtagDebounceRef.current = setTimeout(async () => {
      try {
        const r = await aura.hashtags(q);
        setHashtagSuggestions(r.tags);
        setShowSuggestions(r.tags.length > 0);
      } catch {
        // ignore
      }
    }, 200);
    return () => {
      if (hashtagDebounceRef.current) clearTimeout(hashtagDebounceRef.current);
    };
  }, [query]);

  const follow = async (u: AuraUser) => {
    try {
      const r = await aura.follow(u.username);
      setFollowingIds((s) => {
        const n = new Set(s);
        if (r.following) n.add(u.id);
        else n.delete(u.id);
        return n;
      });
    } catch (e: any) {
      toast({ title: "Couldn't follow", description: e.message, variant: "destructive" });
    }
  };

  const hasSearch = query.trim().length > 0;
  const showResults = hasSearch && searchResults;

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Discover</h1>
        <p className="text-sm text-muted-foreground">Search posts, hashtags & grinders to follow.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.startsWith("#") && hashtagSuggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="Search by username, caption, or #hashtag…"
          className="pl-9 pr-9 bg-muted/30 border-border"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Hashtag autocomplete dropdown */}
        {showSuggestions && hashtagSuggestions.length > 0 && (
          <div className="absolute z-30 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
            <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground border-b border-border">
              Hashtags
            </p>
            {hashtagSuggestions.map((s) => (
              <button
                key={s.tag}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setQuery(`#${s.tag}`);
                  setShowSuggestions(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/30 transition text-left"
              >
                <span className="h-7 w-7 rounded-lg bg-sky-500/15 flex items-center justify-center">
                  <Hash className="h-3.5 w-3.5 text-sky-300" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-sky-300">#{s.tag}</span>
                </span>
                <span className="text-xs text-muted-foreground">{s.count} post{s.count !== 1 ? "s" : ""}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick hashtag chips */}
      {!hasSearch && (
        <div className="flex flex-wrap gap-2">
          {["#fitness", "#earnings", "#car", "#goal", "#business", "#travel"].map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition"
            >
              <Hash className="h-3 w-3" /> {tag.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* SEARCH RESULTS */}
      {showResults ? (
        searching && !searchResults ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : searchResults!.posts.length === 0 && searchResults!.users.length === 0 ? (
          <div className="aura-card rounded-2xl border border-border p-10 text-center">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;. Try a different keyword or hashtag.
            </p>
          </div>
        ) : (
          <Tabs defaultValue={searchResults!.users.length > 0 ? "users" : "posts"}>
            <TabsList className="grid w-full grid-cols-2 mb-3">
              <TabsTrigger value="users">
                People <span className="ml-1 text-xs text-muted-foreground">({searchResults!.users.length})</span>
              </TabsTrigger>
              <TabsTrigger value="posts">
                Posts <span className="ml-1 text-xs text-muted-foreground">({searchResults!.posts.length})</span>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="users" className="space-y-2">
              {searchResults!.users.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No users match.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {searchResults!.users.map((u) => (
                    <UserCard
                      key={u.id}
                      u={u}
                      isFollowing={followingIds.has(u.id)}
                      onFollow={() => follow(u)}
                      onClick={() => viewProfile(u.username)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="posts" className="space-y-3">
              {searchResults!.posts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No posts match.</p>
              ) : (
                searchResults!.posts.map((p) => <PostCard key={p.id} post={p} />)
              )}
            </TabsContent>
          </Tabs>
        )
      ) : (
        /* SUGGESTED USERS (default, no search) */
        <>
          <h2 className="px-1 text-sm font-semibold text-muted-foreground">Suggested for you</h2>
          {loadingSug ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : suggested.length === 0 ? (
            <div className="aura-card rounded-2xl border border-border p-10 text-center text-sm text-muted-foreground">
              You&rsquo;re following everyone. Nice network! 🎉
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {suggested.map((u) => (
                <UserCard
                  key={u.id}
                  u={u}
                  isFollowing={followingIds.has(u.id)}
                  onFollow={() => follow(u)}
                  onClick={() => viewProfile(u.username)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UserCard({
  u,
  isFollowing,
  onFollow,
  onClick,
}: {
  u: AuraUser;
  isFollowing: boolean;
  onFollow: () => void;
  onClick: () => void;
}) {
  const cat = u.bio ? null : null;
  return (
    <div className="aura-card rounded-2xl border border-border p-4 flex items-center gap-3">
      <Avatar
        username={u.username}
        avatarUrl={u.avatarUrl}
        avatarColor={u.avatarColor}
        isVerified={u.isVerified}
        size="md"
        onClick={onClick}
      />
      <div className="min-w-0 flex-1">
        <button
          onClick={onClick}
          className="flex items-center gap-1 font-semibold hover:underline truncate"
        >
          <span className="truncate">{u.username}</span>
          {u.isVerified && (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 verified-badge shrink-0">
              <path fill="oklch(0.78 0.2 60)" d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8L3.2 16l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 1.5z" />
              <path fill="oklch(0.13 0.02 290)" d="M10.6 14.6l-2.3-2.3 1.4-1.4 1 1 3.2-3.2 1.4 1.4-4.7 4.5z" />
            </svg>
          )}
        </button>
        <p className="text-xs text-muted-foreground truncate">
          {u.followerCount ? `${formatNumber(u.followerCount)} followers` : "New here"} · {u.postCount ?? 0} posts
        </p>
        {u.bio && <p className="text-xs text-muted-foreground/80 truncate mt-0.5">{u.bio}</p>}
      </div>
      <Button
        size="sm"
        variant={isFollowing ? "secondary" : "default"}
        onClick={onFollow}
        className={isFollowing ? "" : "aura-gradient-bg text-white hover:opacity-90"}
      >
        {isFollowing ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
      </Button>
    </div>
  );
}
