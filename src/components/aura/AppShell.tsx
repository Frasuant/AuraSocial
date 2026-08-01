"use client";

import { useEffect } from "react";
import {
  Home,
  Compass,
  PlusCircle,
  User as UserIcon,
  ShieldCheck,
  Rocket,
  LogOut,
  Flame,
  Bell,
  TrendingUp,
  Bookmark,
} from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Feed } from "./Feed";
import { ExploreView } from "./ExploreView";
import { ProfileView } from "./ProfileView";
import { AdminPanel } from "./AdminPanel";
import { NotificationsView } from "./NotificationsView";
import { TrendingView } from "./TrendingView";
import { BookmarksView } from "./BookmarksView";
import { FollowListView } from "./FollowListView";
import { CreatePostDialog } from "./CreatePostDialog";
import { EditProfileDialog } from "./EditProfileDialog";
import { useToast } from "@/hooks/use-toast";

export function AppShell() {
  const {
    user,
    setUser,
    view,
    setView,
    viewProfile,
    setCreateOpen,
    setDeployOpen,
    unreadCount,
    setUnreadCount,
  } = useApp();
  const { toast } = useToast();

  // Poll for unread notification count every 30s
  useEffect(() => {
    if (!user) return;
    const poll = () => {
      aura
        .notifications()
        .then((r) => setUnreadCount(r.unreadCount))
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [user, setUnreadCount]);

  const logout = async () => {
    await aura.logout();
    setUser(null);
    setView("feed");
    toast({ title: "Logged out", description: "See you on the grind." });
  };

  const navItems = [
    { id: "feed" as const, label: "Home", icon: Home },
    { id: "trending" as const, label: "Trending", icon: TrendingUp },
    { id: "explore" as const, label: "Explore", icon: Compass },
    { id: "create" as const, label: "Create", icon: PlusCircle, action: () => setCreateOpen(true) },
    { id: "bookmarks" as const, label: "Saved", icon: Bookmark },
    {
      id: "notifications" as const,
      label: "Alerts",
      icon: Bell,
      badge: unreadCount,
      action: () => setView("notifications"),
    },
    { id: "profile" as const, label: "Profile", icon: UserIcon, action: () => user && viewProfile(user.username) },
  ];

  const go = (item: (typeof navItems)[number]) => {
    if (item.action) item.action();
    else setView(item.id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-4">
          <button onClick={() => setView("feed")} className="flex items-center gap-2">
            <div className="aura-gradient-bg h-8 w-8 rounded-xl flex items-center justify-center aura-glow">
              <Flame className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight hidden sm:block">
              Aura<span className="aura-gradient-text">Media</span>
            </span>
          </button>

          <div className="flex-1" />

          {/* Notifications bell */}
          <button
            onClick={() => setView("notifications")}
            className={cn(
              "relative rounded-full p-2 transition",
              view === "notifications"
                ? "bg-white/10 text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            )}
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {user?.isAdmin && (
            <button
              onClick={() => setView("admin")}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition",
                view === "admin"
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                  : "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </button>
          )}

          <button onClick={() => user && viewProfile(user.username)} className="shrink-0">
            <Avatar
              username={user?.username || "?"}
              avatarUrl={user?.avatarUrl}
              avatarColor={user?.avatarColor}
              isVerified={user?.isVerified}
              size="sm"
            />
          </button>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex-1 mx-auto w-full max-w-6xl flex">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-56 lg:w-60 shrink-0 border-r border-white/5 py-4 px-3 sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => go(item)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition relative",
                  view === item.id
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-bold text-white flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                ) : null}
              </button>
            ))}
            {user?.isAdmin && (
              <>
                <button
                  onClick={() => setView("admin")}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                    view === "admin"
                      ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-200 ring-1 ring-amber-500/30"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <ShieldCheck className="h-5 w-5" />
                  Admin Console
                </button>
                <button
                  onClick={() => setDeployOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition"
                >
                  <Rocket className="h-5 w-5 text-amber-300" />
                  Deploy guide
                </button>
              </>
            )}
          </nav>

          <div className="mt-auto space-y-2">
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300 transition"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </button>
            <p className="px-3 text-[10px] text-muted-foreground/60">
              AuraMedia · v1.2 · AuraGuard AI active
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-4">
          {view === "feed" && <Feed />}
          {view === "trending" && <TrendingView />}
          {view === "explore" && <ExploreView />}
          {view === "bookmarks" && <BookmarksView />}
          {view === "notifications" && <NotificationsView />}
          {view === "followers" && <FollowListView mode="followers" />}
          {view === "following" && <FollowListView mode="following" />}
          {view === "profile" && <ProfileView />}
          {view === "admin" && user?.isAdmin && <AdminPanel />}
          {view === "admin" && !user?.isAdmin && (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center text-muted-foreground">
              Admins only.
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav — 5 core actions */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/5 bg-background/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex h-16">
          {/* Home */}
          <MobileNavBtn item={navItems[0]} view={view} go={go} />
          {/* Explore */}
          <MobileNavBtn item={navItems[2]} view={view} go={go} />
          {/* Create (center, emphasized) */}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
          >
            <div className="aura-gradient-bg h-9 w-9 rounded-xl flex items-center justify-center aura-glow">
              <PlusCircle className="h-5 w-5 text-white" />
            </div>
          </button>
          {/* Bookmarks */}
          <MobileNavBtn item={navItems[4]} view={view} go={go} />
          {/* Notifications */}
          <MobileNavBtn item={navItems[5]} view={view} go={go} />
        </div>
      </nav>

      <CreatePostDialog />
      <EditProfileDialog />
    </div>
  );
}

function MobileNavBtn({
  item,
  view,
  go,
}: {
  item: { id: string; label: string; icon: any; badge?: number };
  view: string;
  go: (item: any) => void;
}) {
  return (
    <button
      onClick={() => go(item)}
      className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition relative"
    >
      <span className={view === item.id ? "text-foreground" : "text-muted-foreground"}>
        <item.icon className="h-5 w-5" />
      </span>
      <span className={view === item.id ? "text-foreground" : "text-muted-foreground"}>
        {item.label}
      </span>
      {item.badge && item.badge > 0 ? (
        <span className="absolute top-1 right-1/4 min-w-[14px] h-3.5 px-1 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[9px] font-bold text-white flex items-center justify-center">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      ) : null}
    </button>
  );
}
