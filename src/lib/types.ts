export interface AuraUser {
  id: string;
  username: string;
  email?: string;
  bio: string;
  avatarUrl: string;
  avatarColor: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  postCount?: number;
  followerCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
  isMe?: boolean;
}

export interface PostAuthor {
  id: string;
  username: string;
  avatarUrl: string;
  avatarColor: string;
  isVerified: boolean;
  isAdmin: boolean;
}

export interface Post {
  id: string;
  caption: string;
  imageUrl: string;
  images?: string[];
  category: string;
  status: string;
  moderationNote: string;
  moderationRisk: number;
  createdAt: string;
  author: PostAuthor | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  bookmarkedByMe?: boolean;
  bookmarkedAt?: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: PostAuthor;
}

export interface ModerationResult {
  approved: boolean;
  risk: number;
  category: string;
  note: string;
  summary: string;
}

export type ViewName =
  | "feed"
  | "explore"
  | "profile"
  | "create"
  | "admin"
  | "deploy"
  | "notifications"
  | "search"
  | "trending"
  | "bookmarks"
  | "followers"
  | "following"
  | "discovery"
  | "postDetail"
  | "drafts";
