"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck, Loader2 } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/button";
import { cn, timeAgo } from "@/lib/utils";

interface NotifItem {
  id: string;
  type: string;
  postId: string | null;
  content: string;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    avatarUrl: string;
    avatarColor: string;
    isVerified: boolean;
    isAdmin: boolean;
  };
}

export function NotificationsView() {
  const { viewProfile, setUnreadCount } = useApp();
  const { toast } = useToast();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const load = () => {
    setLoading(true);
    aura
      .notifications()
      .then((r) => {
        setItems(r.notifications);
        setUnreadCount(r.unreadCount);
      })
      .catch((e) => toast({ title: "Couldn't load notifications", description: e.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await aura.markNotificationsRead();
      setItems((list) => list.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e: any) {
      toast({ title: "Couldn't mark read", description: e.message, variant: "destructive" });
    } finally {
      setMarking(false);
    }
  };

  const icon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-rose-400 fill-rose-500" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-sky-400" />;
      case "follow":
        return <UserPlus className="h-4 w-4 text-emerald-400" />;
      default:
        return <Bell className="h-4 w-4 text-amber-400" />;
    }
  };

  const message = (n: NotifItem) => {
    switch (n.type) {
      case "like":
        return <span>liked your flex.</span>;
      case "comment":
        return (
          <span>
            commented: <span className="text-foreground/80">&ldquo;{n.content}&rdquo;</span>
          </span>
        );
      case "follow":
        return <span>started following you.</span>;
      default:
        return <span>sent you a notification.</span>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-amber-300" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground">Likes, comments and new followers.</p>
        </div>
        {items.some((i) => !i.read) && (
          <Button variant="secondary" size="sm" onClick={markAllRead} disabled={marking}>
            {marking ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4 mr-1.5" />}
            Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="aura-card rounded-2xl border border-border p-10 text-center">
          <div className="text-5xl mb-3 aura-float">🔔</div>
          <h3 className="font-semibold">All quiet for now</h3>
          <p className="text-sm text-muted-foreground mt-1">
            When someone likes, comments on, or follows you, it shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n, i) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className={cn(
                "aura-card rounded-2xl border p-3 flex items-center gap-3 transition",
                n.read ? "border-border" : "border-amber-500/30 bg-amber-500/[0.04]"
              )}
            >
              <div className="relative shrink-0">
                <Avatar
                  username={n.actor.username}
                  avatarUrl={n.actor.avatarUrl}
                  avatarColor={n.actor.avatarColor}
                  isVerified={n.actor.isVerified}
                  size="md"
                  onClick={() => viewProfile(n.actor.username)}
                />
                <div className="absolute -bottom-1 -right-1 rounded-full bg-card p-1 ring-1 ring-white/10">
                  {icon(n.type)}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed">
                  <button
                    onClick={() => viewProfile(n.actor.username)}
                    className="font-semibold hover:underline"
                  >
                    {n.actor.username}
                  </button>{" "}
                  {message(n)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.createdAt)} ago</p>
              </div>
              {!n.read && <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
