import type { AuraUser, Post, Comment, ModerationResult } from "@/lib/types";

async function api<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any)?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const aura = {
  // Auth
  register: (body: { username: string; email: string; password: string }) =>
    api<{ ok: boolean }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { identifier: string; password: string }) =>
    api<{ ok: boolean }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => api<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  me: () => api<{ user: AuraUser | null }>("/api/auth/me"),

  // Posts
  feed: (params: { category?: string; status?: string; cursor?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.set("category", params.category);
    if (params.status) q.set("status", params.status);
    if (params.cursor) q.set("cursor", params.cursor);
    return api<{ posts: Post[]; nextCursor: string | null }>(`/api/posts?${q}`);
  },
  createPost: (body: { caption: string; category: string; imageUrl?: string; images?: string[]; draft?: boolean }) =>
    api<{ post: Post; moderation: ModerationResult }>("/api/posts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  like: (postId: string) =>
    api<{ liked: boolean }>(`/api/posts/${postId}/like`, { method: "POST" }),
  deletePost: (postId: string) =>
    api<{ ok: boolean }>(`/api/posts/${postId}/delete`, { method: "DELETE" }),
  editPost: (postId: string, body: { caption: string; category: string; images?: string[]; draft?: boolean; publish?: boolean }) =>
    api<{ post: Post; moderation: ModerationResult }>(`/api/posts/${postId}/edit`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  reposts: (postId: string) =>
    api<{ reposts: Array<{ id: string; caption: string; createdAt: string; author: any }> }>(`/api/posts/${postId}/reposts`),
  drafts: () =>
    api<{ posts: Post[] }>("/api/drafts"),
  bookmark: (postId: string) =>
    api<{ bookmarked: boolean }>(`/api/posts/${postId}/bookmark`, { method: "POST" }),
  bookmarks: () =>
    api<{ posts: Post[] }>("/api/bookmarks"),
  trending: () =>
    api<{ posts: Post[] }>("/api/trending"),
  discovery: () =>
    api<{ posts: Post[] }>("/api/discovery"),
  postDetail: (postId: string) =>
    api<{ post: Post & { bookmarkCount: number; repostCount: number; repostOf: any } }>(`/api/posts/${postId}`),
  repost: (postId: string, quote?: string) =>
    api<{ ok: boolean; repostId: string }>(`/api/posts/${postId}/repost`, {
      method: "POST",
      body: JSON.stringify({ quote: quote || "" }),
    }),
  unrepost: (postId: string) =>
    api<{ ok: boolean }>(`/api/posts/${postId}/repost`, { method: "DELETE" }),
  userLikes: (username: string) =>
    api<{ posts: Post[] }>(`/api/users/${username}/likes`),
  comments: (postId: string) =>
    api<{ comments: Comment[] }>(`/api/posts/${postId}/comments`),
  comment: (postId: string, content: string) =>
    api<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  // Users
  profile: (username: string) =>
    api<{ user: AuraUser; posts: Post[] }>(`/api/users/${username}`),
  follow: (username: string) =>
    api<{ following: boolean }>(`/api/users/${username}/follow`, { method: "POST" }),
  followers: (username: string) =>
    api<{ users: AuraUser[] }>(`/api/users/${username}/followers`),
  following: (username: string) =>
    api<{ users: AuraUser[] }>(`/api/users/${username}/following`),
  explore: () =>
    api<{ users: AuraUser[] }>("/api/explore"),
  suggestedUsers: () =>
    api<{ users: AuraUser[] }>("/api/suggested-users"),
  activity: () =>
    api<{
      activity: Array<{
        id: string;
        type: "like" | "comment" | "repost";
        createdAt: string;
        content?: string;
        post: { id: string; caption: string; category: string; createdAt: string; author: any };
        repostOf?: any;
      }>;
    }>("/api/activity"),
  recordProfileView: (username: string) =>
    api<{ ok: boolean }>(`/api/users/${username}/view`, { method: "POST" }),
  profileViews: () =>
    api<{
      totalViews: number;
      viewers: Array<{
        id: string;
        username: string;
        bio: string;
        avatarUrl: string;
        avatarColor: string;
        isVerified: boolean;
        isAdmin: boolean;
        followerCount: number;
        postCount: number;
        viewedAt: string;
      }>;
    }>("/api/profile-views"),

  // Upload
  upload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api<{ url: string }>("/api/upload", { method: "POST", body: fd });
  },

  // Profile editing
  updateProfile: (body: { bio?: string; avatarColor?: string; avatarUrl?: string }) =>
    api<{ user: AuraUser }>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) }),

  // Report post
  reportPost: (postId: string, reason: string) =>
    api<{ reported: boolean; openReports?: number }>(`/api/posts/${postId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // Notifications
  notifications: () =>
    api<{
      notifications: Array<{
        id: string;
        type: string;
        postId: string | null;
        content: string;
        read: boolean;
        createdAt: string;
        actor: { id: string; username: string; avatarUrl: string; avatarColor: string; isVerified: boolean; isAdmin: boolean };
      }>;
      unreadCount: number;
    }>("/api/notifications"),
  markNotificationsRead: () =>
    api<{ ok: boolean }>("/api/notifications/read", { method: "POST" }),

  // Search
  search: (q: string) =>
    api<{ posts: Post[]; users: AuraUser[] }>(`/api/search?q=${encodeURIComponent(q)}`),
  hashtags: (q: string) =>
    api<{ tags: { tag: string; count: number }[] }>(`/api/hashtags?q=${encodeURIComponent(q)}`),

  // Admin
  adminUsers: () => api<{ users: AuraUser[] }>("/api/admin/users"),
  adminVerify: (userId: string, verified: boolean) =>
    api<{ user: AuraUser }>("/api/admin/verify", {
      method: "POST",
      body: JSON.stringify({ userId, verified }),
    }),
  adminPosts: (status: string) =>
    api<{ posts: Post[] }>(`/api/admin/posts?status=${status}`),
  adminSetPostStatus: (postId: string, status: string) =>
    api<{ post: Post }>(`/api/admin/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  adminDeletePost: (postId: string) =>
    api<{ ok: boolean }>(`/api/admin/posts/${postId}`, { method: "DELETE" }),
  adminPassword: (currentPassword: string, newPassword: string) =>
    api<{ ok: boolean }>("/api/admin/password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  adminStats: () =>
    api<{
      stats: { userCount: number; postCount: number; flaggedCount: number; verifiedCount: number };
      recentFlags: any[];
    }>("/api/admin/stats"),
  adminDbStatus: () =>
    api<{
      backend: "turso" | "postgres" | "sqlite-file" | "sqlite-tmp";
      persistent: boolean;
      note: string;
      databaseUrl: string;
    }>("/api/admin/db-status"),
  adminReports: () =>
    api<{ reports: any[] }>("/api/admin/reports"),
};
