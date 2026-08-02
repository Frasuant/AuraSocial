"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Users as UsersIcon,
  Flag,
  KeyRound,
  Loader2,
  Check,
  X,
  Trash2,
  ShieldAlert,
  BarChart3,
  Rocket,
  Database,
  AlertTriangle,
} from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categoryMeta } from "@/lib/constants";
import { cn, timeAgo, formatNumber } from "@/lib/utils";
import type { AuraUser, Post } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function AdminPanel() {
  const { setDeployOpen } = useApp();
  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center aura-glow">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold">Admin Console</h1>
          <p className="text-sm text-muted-foreground">
            Verify members, moderate the queue, manage the platform.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setDeployOpen(true)}
          className="shrink-0"
        >
          <Rocket className="h-4 w-4 mr-1.5" /> Deploy
        </Button>
      </div>

      <DbStatusBanner />

      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6">
          <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-1.5" />Stats</TabsTrigger>
          <TabsTrigger value="users"><UsersIcon className="h-4 w-4 mr-1.5" />Users</TabsTrigger>
          <TabsTrigger value="queue"><Flag className="h-4 w-4 mr-1.5" />AI Queue</TabsTrigger>
          <TabsTrigger value="reports"><AlertTriangle className="h-4 w-4 mr-1.5" />Reports</TabsTrigger>
          <TabsTrigger value="settings"><KeyRound className="h-4 w-4 mr-1.5" />Settings</TabsTrigger>
          <TabsTrigger value="danger" className="text-rose-400"><Trash2 className="h-4 w-4 mr-1.5" />Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="queue" className="mt-4">
          <QueueTab />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ReportsTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab />
        </TabsContent>
        <TabsContent value="danger" className="mt-4">
          <DangerZoneTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aura
      .adminStats()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const cards = [
    { label: "Members", value: data.stats.userCount, icon: UsersIcon, color: "from-violet-500 to-fuchsia-500" },
    { label: "Posts", value: data.stats.postCount, icon: BarChart3, color: "from-emerald-500 to-teal-500" },
    { label: "Flagged", value: data.stats.flaggedCount, icon: Flag, color: "from-amber-500 to-orange-500" },
    { label: "Verified", value: data.stats.verifiedCount, icon: ShieldCheck, color: "from-sky-500 to-cyan-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="aura-card rounded-2xl border border-border p-4">
            <div className={cn("h-9 w-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-2", c.color)}>
              <c.icon className="h-4.5 w-4.5 text-white" />
            </div>
            <p className="text-2xl font-bold">{formatNumber(c.value)}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="aura-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-amber-400" /> Recent AuraGuard flags
        </h3>
        {data.recentFlags.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing flagged. The community is clean. ✨</p>
        ) : (
          <ul className="space-y-2">
            {data.recentFlags.map((f: any) => (
              <li key={f.id} className="rounded-xl bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>@{f.author.username} · {categoryMeta(f.category).emoji} {categoryMeta(f.category).label}</span>
                  <span>risk {f.risk}/100 · {timeAgo(f.createdAt)}</span>
                </div>
                <p className="text-sm line-clamp-2">{f.caption}</p>
                {f.note && <p className="text-xs text-amber-300 mt-1">⚠ {f.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UsersTab() {
  const { toast } = useToast();
  const { viewProfile } = useApp();
  const [users, setUsers] = useState<AuraUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = () =>
    aura
      .adminUsers()
      .then((r) => setUsers(r.users))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const toggleVerify = async (u: AuraUser) => {
    setToggling(u.id);
    try {
      const r = await aura.adminVerify(u.id, !u.isVerified);
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, isVerified: r.user.isVerified } : x)));
      toast({
        title: r.user.isVerified ? "Verified ✅" : "Unverified",
        description: `@${u.username} ${r.user.isVerified ? "now has the badge" : "lost the badge"}`,
      });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleteBusy(true);
    try {
      const r = await aura.adminDeleteUser(deletingId);
      setUsers((list) => list.filter((u) => u.id !== deletingId));
      toast({
        title: "Account deleted 🗑",
        description: `@${r.deletedUsername} and all their posts are gone.`,
      });
      setDeletingId(null);
    } catch (e: any) {
      toast({ title: "Couldn't delete", description: e.message, variant: "destructive" });
    } finally {
      setDeleteBusy(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  const deletingUser = users.find((u) => u.id === deletingId);

  return (
    <>
      <div className="aura-card rounded-2xl border border-border overflow-hidden">
        <div className="max-h-[70vh] overflow-y-auto divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 hover:bg-muted/30">
              <Avatar
                username={u.username}
                avatarUrl={u.avatarUrl}
                avatarColor={u.avatarColor}
                isVerified={u.isVerified}
                size="md"
                onClick={() => viewProfile(u.username)}
              />
              <div className="min-w-0 flex-1">
                <button
                  onClick={() => viewProfile(u.username)}
                  className="flex items-center gap-1 font-semibold hover:underline truncate"
                >
                  <span className="truncate">{u.username}</span>
                  {u.isVerified && (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 verified-badge shrink-0">
                      <path fill="oklch(0.78 0.2 60)" d="M12 1.5l2.4 1.8 3 .1 1 2.8 2.4 1.8-1 2.8 1 2.8-2.4 1.8-1 2.8-3 .1L12 22.5l-2.4-1.8-3-.1-1-2.8L3.2 16l1-2.8-1-2.8 2.4-1.8 1-2.8 3-.1L12 1.5z" />
                      <path fill="oklch(0.13 0.02 290)" d="M10.6 14.6l-2.3-2.3 1.4-1.4 1 1 3.2-3.2 1.4 1.4-4.7 4.5z" />
                    </svg>
                  )}
                  {u.isAdmin && (
                    <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Admin
                    </span>
                  )}
                </button>
                <p className="text-xs text-muted-foreground truncate">
                  {u.email} · {u.postCount} posts · {u.followerCount} followers
                </p>
              </div>
              <Button
                size="sm"
                disabled={toggling === u.id || u.isAdmin}
                variant={u.isVerified ? "secondary" : "default"}
                onClick={() => toggleVerify(u)}
                className={u.isVerified ? "" : "aura-gradient-bg text-white hover:opacity-90"}
              >
                {toggling === u.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : u.isVerified ? (
                  <>
                    <Check className="h-4 w-4 mr-1" /> Verified
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
              {!u.isAdmin && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeletingId(u.id)}
                  className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 shrink-0"
                  title="Delete account"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Delete user confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete @{deletingUser?.username}&rsquo;s account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the account AND all their posts, likes, comments, follows,
              bookmarks, and reports. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteBusy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBusy ? "Deleting…" : "Delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function QueueTab() {
  const { toast } = useToast();
  const [status, setStatus] = useState("flagged");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    aura
      .adminPosts(status)
      .then((r) => setPosts(r.posts))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [status]);

  const setStatus_ = async (post: Post, newStatus: string) => {
    setBusy(post.id);
    try {
      await aura.adminSetPostStatus(post.id, newStatus);
      setPosts((list) => list.filter((p) => p.id !== post.id));
      toast({ title: newStatus === "published" ? "Approved & live ✅" : newStatus === "removed" ? "Removed 🗑" : "Updated" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (post: Post) => {
    setBusy(post.id);
    try {
      await aura.adminDeletePost(post.id);
      setPosts((list) => list.filter((p) => p.id !== post.id));
      toast({ title: "Post deleted" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const tabs = [
    { value: "flagged", label: "Flagged" },
    { value: "published", label: "Live" },
    { value: "removed", label: "Removed" },
    { value: "all", label: "All" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium border transition",
              status === t.value
                ? "aura-gradient-bg text-white border-transparent"
                : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="aura-card rounded-2xl border border-border p-10 text-center">
          <div className="text-4xl mb-2">✨</div>
          <p className="text-sm text-muted-foreground">Nothing in this queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => {
            const cat = categoryMeta(p.category);
            return (
              <div key={p.id} className="aura-card rounded-2xl border border-border p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar
                    username={p.author?.username || "?"}
                    avatarUrl={p.author?.avatarUrl}
                    avatarColor={p.author?.avatarColor}
                    isVerified={p.author?.isVerified}
                    size="sm"
                  />
                  <span className="font-semibold text-sm">{p.author?.username}</span>
                  <span className="text-xs text-muted-foreground">· {timeAgo(p.createdAt)}</span>
                  <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-xs text-white/90", cat.color)}>
                    {cat.emoji} {cat.label}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words mb-2">{p.caption}</p>
                {p.moderationNote && (
                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-200 mb-2">
                    <b>AuraGuard:</b> {p.moderationNote} · risk {p.moderationRisk}/100
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => setStatus_(p, "published")}
                    disabled={busy === p.id}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setStatus_(p, "removed")}
                    disabled={busy === p.id}
                  >
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => remove(p)}
                    disabled={busy === p.id}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  const { toast } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!current || !next)
      return toast({ title: "Fill all fields", variant: "destructive" });
    if (next !== confirm)
      return toast({ title: "Passwords don't match", variant: "destructive" });
    if (next.length < 6)
      return toast({ title: "New password too short (min 6)", variant: "destructive" });
    setSaving(true);
    try {
      await aura.adminPassword(current, next);
      toast({ title: "Password updated 🔐", description: "Use the new password next time you log in." });
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (e: any) {
      toast({ title: "Couldn't update", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aura-card rounded-2xl border border-border p-6 max-w-md">
      <h3 className="font-semibold mb-1">Change Admin password</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Update the Admin account credentials. The change takes effect immediately.
      </p>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="cur">Current password</Label>
          <Input
            id="cur"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="bg-muted/30 border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="next">New password</Label>
          <Input
            id="next"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="bg-muted/30 border-border"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="conf">Confirm new password</Label>
          <Input
            id="conf"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="bg-muted/30 border-border"
          />
        </div>
        <Button onClick={save} disabled={saving} className="w-full aura-gradient-bg text-white hover:opacity-90">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
        </Button>
      </div>
    </div>
  );
}

function DbStatusBanner() {
  const { setDeployOpen } = useApp();
  const [status, setStatus] = useState<{
    backend: string;
    persistent: boolean;
    note: string;
    databaseUrl: string;
  } | null>(null);

  useEffect(() => {
    aura.adminDbStatus().then(setStatus).catch(() => {});
  }, []);

  if (!status) return null;

  const ok = status.persistent;
  const backendLabel =
    status.backend === "turso"
      ? "Turso (cloud SQLite)"
      : status.backend === "postgres"
      ? "PostgreSQL"
      : status.backend === "sqlite-file"
      ? "SQLite file"
      : "Ephemeral /tmp SQLite";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 flex items-start gap-3",
        ok
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-amber-500/40 bg-amber-500/10"
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
          ok ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
        )}
      >
        {ok ? <Database className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={cn("font-semibold", ok ? "text-emerald-300" : "text-amber-300")}>
            {ok ? "Database: persistent" : "Database: NOT persistent"}
          </p>
          <span className="rounded-full bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
            {backendLabel}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{status.note}</p>
        <p className="text-[10px] text-muted-foreground/70 mt-1 font-mono break-all">
          {status.databaseUrl}
        </p>
        {!ok && (
          <Button
            size="sm"
            variant="secondary"
            className="mt-2"
            onClick={() => setDeployOpen(true)}
          >
            <Rocket className="h-3.5 w-3.5 mr-1.5" /> Set up a persistent database
          </Button>
        )}
      </div>
    </div>
  );
}

function ReportsTab() {
  const { toast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    aura
      .adminReports()
      .then((r) => setReports(r.reports))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (postId: string, action: "published" | "removed") => {
    setBusy(postId);
    try {
      await aura.adminSetPostStatus(postId, action);
      setReports((list) => list.filter((r) => r.post.id !== postId));
      toast({
        title: action === "published" ? "Cleared & restored ✅" : "Removed 🗑",
        description: action === "published" ? "Post is back in the feed." : "Post taken down.",
      });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200/90">
        <b className="text-amber-300">Community reports.</b> Posts flagged by users (3+ reports
        auto-hide). Review and decide: restore or remove.
      </div>
      {reports.length === 0 ? (
        <div className="aura-card rounded-2xl border border-border p-10 text-center">
          <div className="text-4xl mb-2">🤝</div>
          <p className="text-sm text-muted-foreground">No community reports. Clean community!</p>
        </div>
      ) : (
        reports.map((r) => {
          const cat = categoryMeta(r.post.category);
          return (
            <div key={r.post.id} className="aura-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Avatar
                  username={r.post.author.username}
                  avatarUrl={r.post.author.avatarUrl}
                  avatarColor={r.post.author.avatarColor}
                  isVerified={r.post.author.isVerified}
                  size="sm"
                />
                <span className="font-semibold text-sm">{r.post.author.username}</span>
                <span className="text-xs text-muted-foreground">· {timeAgo(r.post.createdAt)}</span>
                <span className={cn("ml-auto inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2 py-0.5 text-xs text-white/90", cat.color)}>
                  {cat.emoji} {cat.label}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words mb-2">{r.post.caption}</p>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-300 ring-1 ring-rose-500/30">
                  <AlertTriangle className="h-3 w-3" /> {r.reportCount} report{r.reportCount > 1 ? "s" : ""}
                </span>
                {Object.entries(r.reasons).map(([reason, count]: [string, any]) => (
                  <span key={reason} className="rounded-full bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
                    {reason} ×{count}
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => act(r.post.id, "published")}
                  disabled={busy === r.post.id}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" /> Clear & restore
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => act(r.post.id, "removed")}
                  disabled={busy === r.post.id}
                >
                  <X className="h-4 w-4 mr-1" /> Remove post
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function DangerZoneTab() {
  const { toast } = useToast();
  const [resetting, setResetting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [resetResults, setResetResults] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({
    posts: false, comments: false, likes: false, follows: false,
    bookmarks: false, notifications: false, reports: false,
    blocks: false, profileViews: false, users: false,
  });

  const anySelected = Object.values(selected).some(Boolean);

  const toggleItem = (key: string) => {
    setSelected((s) => ({ ...s, [key]: !s[key] }));
  };

  const resetItems: { key: string; label: string; desc: string; emoji: string }[] = [
    { key: "posts", label: "All Posts", desc: "Deletes every post + their likes, comments, bookmarks & reports", emoji: "📝" },
    { key: "comments", label: "All Comments", desc: "Deletes every comment on every post", emoji: "💬" },
    { key: "likes", label: "All Likes", desc: "Resets all likes to zero", emoji: "❤️" },
    { key: "follows", label: "All Follows", desc: "Unfollows everyone from everyone", emoji: "👥" },
    { key: "bookmarks", label: "All Bookmarks", desc: "Clears all saved posts", emoji: "🔖" },
    { key: "notifications", label: "All Notifications", desc: "Clears the notification bell for everyone", emoji: "🔔" },
    { key: "reports", label: "All Reports", desc: "Clears the community reports queue", emoji: "🚩" },
    { key: "blocks", label: "All Blocks", desc: "Unblocks everyone", emoji: "🚫" },
    { key: "profileViews", label: "Profile Views", desc: "Clears all profile view history", emoji: "👁️" },
    { key: "users", label: "All Non-Admin Users", desc: "Deletes every user account except Admin", emoji: "👤" },
  ];

  const doReset = async () => {
    if (!anySelected) return;
    setResetting(true);
    setResetResults(null);
    try {
      const body: any = {};
      for (const [key, val] of Object.entries(selected)) {
        if (val) body[key] = true;
      }
      const r = await aura.adminReset(body);
      setResetResults(r.results);
      toast({ title: "Reset complete", description: r.results.length + " operations executed." });
      setConfirmOpen(false);
      setSelected({
        posts: false, comments: false, likes: false, follows: false,
        bookmarks: false, notifications: false, reports: false,
        blocks: false, profileViews: false, users: false,
      });
    } catch (e: any) {
      toast({ title: "Reset failed", description: e.message, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const doNukeAll = async () => {
    if (confirmText !== "DELETE") return;
    setResetting(true);
    setResetResults(null);
    try {
      const r = await aura.adminReset({ allExceptAdmin: true });
      setResetResults(r.results);
      toast({ title: "Full wipe complete", description: "All data deleted. Only Admin remains." });
      setConfirmText("");
    } catch (e: any) {
      toast({ title: "Wipe failed", description: e.message, variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="h-5 w-5 text-rose-400" />
          <h3 className="font-semibold text-rose-300">Danger Zone</h3>
        </div>
        <p className="text-xs text-rose-200/80">
          These actions permanently delete data. They cannot be undone. Select what you want to wipe below.
        </p>
      </div>

      <div className="aura-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold mb-3">Selective Reset</h3>
        <p className="text-xs text-muted-foreground mb-4">Pick what to delete. The Admin account is always preserved.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {resetItems.map((item) => (
            <button
              key={item.key}
              onClick={() => toggleItem(item.key)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                selected[item.key]
                  ? "border-rose-500/40 bg-rose-500/10"
                  : "border-border bg-muted/30 hover:bg-muted/50"
              )}
            >
              <span className="text-xl shrink-0">{item.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{item.label}</span>
                  {selected[item.key] && (
                    <span className="rounded-full bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">
                      SELECTED
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={!anySelected || resetting}
            className="flex-1"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete Selected ({Object.values(selected).filter(Boolean).length})
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSelected({
              posts: false, comments: false, likes: false, follows: false,
              bookmarks: false, notifications: false, reports: false,
              blocks: false, profileViews: false, users: false,
            })}
            disabled={!anySelected}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-5">
        <h3 className="font-semibold text-rose-300 mb-1">Full Wipe</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Deletes ALL data except the Admin account. Everything is gone.
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="bg-muted/30 border-rose-500/30"
          />
          <Button
            variant="destructive"
            onClick={doNukeAll}
            disabled={confirmText !== "DELETE" || resetting}
          >
            {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
            Nuke All
          </Button>
        </div>
      </div>

      {resetResults && (
        <div className="aura-card rounded-2xl border border-border p-4">
          <h4 className="text-sm font-semibold mb-2">Reset Results</h4>
          <div className="space-y-1">
            {resetResults.map((r, i) => (
              <p key={i} className="text-xs font-mono">{r}</p>
            ))}
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected data ({Object.values(selected).filter(Boolean).length} categories).
              This action cannot be undone. The Admin account is always preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={doReset}
              disabled={resetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetting ? "Deleting..." : "Yes, delete it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
