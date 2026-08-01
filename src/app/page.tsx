"use client";

import { useEffect, useState } from "react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { AuthScreen } from "@/components/aura/AuthScreen";
import { AppShell } from "@/components/aura/AppShell";
import { DeployGuide } from "@/components/aura/DeployGuide";
import { Flame } from "lucide-react";

export default function Home() {
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aura
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="aura-gradient-bg h-16 w-16 rounded-3xl flex items-center justify-center aura-glow aura-float">
          <Flame className="h-8 w-8 text-white" />
        </div>
        <p className="text-sm text-muted-foreground">Loading AuraMedia…</p>
      </div>
    );
  }

  return (
    <>
      {user ? <AppShell /> : <AuthScreen />}
      {/* Deploy guide is ADMIN-ONLY — never shown to the public */}
      {user?.isAdmin && <DeployGuide />}
    </>
  );
}
