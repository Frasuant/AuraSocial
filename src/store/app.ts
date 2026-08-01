"use client";

import { create } from "zustand";
import type { AuraUser, ViewName } from "@/lib/types";

interface AppState {
  user: AuraUser | null;
  setUser: (u: AuraUser | null) => void;

  view: ViewName;
  setView: (v: ViewName) => void;

  profileUsername: string | null;
  viewProfile: (username: string) => void;

  createOpen: boolean;
  setCreateOpen: (v: boolean) => void;

  editProfileOpen: boolean;
  setEditProfileOpen: (v: boolean) => void;

  deployOpen: boolean;
  setDeployOpen: (v: boolean) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Notifications
  unreadCount: number;
  setUnreadCount: (n: number) => void;

  feedKey: number;
  bumpFeed: () => void;
}

export const useApp = create<AppState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),

  view: "feed",
  setView: (v) => set({ view: v }),

  profileUsername: null,
  viewProfile: (username) => set({ view: "profile", profileUsername: username }),

  createOpen: false,
  setCreateOpen: (v) => set({ createOpen: v }),

  editProfileOpen: false,
  setEditProfileOpen: (v) => set({ editProfileOpen: v }),

  deployOpen: false,
  setDeployOpen: (v) => set({ deployOpen: v }),

  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  unreadCount: 0,
  setUnreadCount: (n) => set({ unreadCount: n }),

  feedKey: 0,
  bumpFeed: () => set((s) => ({ feedKey: s.feedKey + 1 })),
}));
