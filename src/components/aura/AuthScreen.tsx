"use client";

import { useState } from "react";
import { Sparkles, Flame, Trophy, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { aura } from "@/lib/api";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
// NOTE: Admin credentials are NEVER shown publicly. The platform owner logs in with
// credentials provided only in the private handover/worklog, then changes them in Admin → Settings.
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function AuthScreen() {
  const { setUser } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // login
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // register
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPw, setRegPw] = useState("");

  const doLogin = async () => {
    setLoading(true);
    try {
      await aura.login({ identifier: loginId, password: loginPw });
      const { user } = await aura.me();
      setUser(user);
      toast({ title: `Welcome back, ${user?.username}!`, description: "Let's flex. 🔥" });
    } catch (e: any) {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const doRegister = async () => {
    setLoading(true);
    try {
      await aura.register({ username: regName, email: regEmail, password: regPw });
      const { user } = await aura.me();
      setUser(user);
      toast({ title: `Welcome to AuraMedia, ${user?.username}!`, description: "Your grind starts now." });
    } catch (e: any) {
      toast({ title: "Sign up failed", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-10 items-center">
          {/* Hero */}
          <div className="hidden lg:block">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/30 px-3 py-1 text-xs text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" /> AI-moderated · Verified flexes only
            </div>
            <h1 className="text-5xl xl:text-6xl font-black leading-[1.05] tracking-tight">
              Flex your <span className="aura-gradient-text">grind.</span>
              <br />
              Share your <span className="aura-gradient-text">goals.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-md">
              AuraMedia is where goal-setters post the wins that matter — cars, watches,
              earnings, business milestones, fitness PRs. No fakes. No scams. Just the real flex.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
              {[
                { icon: Flame, label: "Flex", desc: "your wins" },
                { icon: Trophy, label: "Goal", desc: "set & hit" },
                { icon: ShieldCheck, label: "Verified", desc: "by Admin" },
              ].map((f) => (
                <div key={f.label} className="rounded-2xl border border-border bg-muted/30 p-4">
                  <f.icon className="h-5 w-5 text-amber-300 mb-2" />
                  <p className="font-semibold text-sm">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Auth card */}
          <div className="aura-card rounded-3xl border border-border p-6 sm:p-8 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 mb-6">
              <div className="aura-gradient-bg h-11 w-11 rounded-2xl flex items-center justify-center aura-glow">
                <Flame className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold">AuraMedia</h2>
                <p className="text-xs text-muted-foreground">Join the grind</p>
              </div>
            </div>

            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 mb-5">
                <TabsTrigger value="login">Log in</TabsTrigger>
                <TabsTrigger value="register">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginId">Username or email</Label>
                  <Input
                    id="loginId"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="username"
                    onKeyDown={(e) => e.key === "Enter" && doLogin()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loginPw">Password</Label>
                  <div className="relative">
                    <Input
                      id="loginPw"
                      type={showPw ? "text" : "password"}
                      value={loginPw}
                      onChange={(e) => setLoginPw(e.target.value)}
                      placeholder="••••••••"
                      onKeyDown={(e) => e.key === "Enter" && doLogin()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={doLogin} disabled={loading} className="w-full aura-gradient-bg text-white hover:opacity-90">
                  {loading ? "Logging in…" : "Log in"}
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="regName">Username</Label>
                  <Input
                    id="regName"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value.toLowerCase())}
                    placeholder="username (lowercase, a-z 0-9 . _)"
                  />
                  <p className="text-[10px] text-muted-foreground">3-35 chars, lowercase letters, numbers, periods, underscores. No consecutive periods.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regEmail">Email</Label>
                  <Input
                    id="regEmail"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regPw">Password</Label>
                  <Input
                    id="regPw"
                    type="password"
                    value={regPw}
                    onChange={(e) => setRegPw(e.target.value)}
                    placeholder="At least 6 characters"
                    onKeyDown={(e) => e.key === "Enter" && doRegister()}
                  />
                </div>
                <Button onClick={doRegister} disabled={loading} className="w-full aura-gradient-bg text-white hover:opacity-90">
                  {loading ? "Creating account…" : "Create account"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  By signing up you agree to keep it real. Sketchy posts get auto-flagged by AuraGuard AI.
                </p>
              </TabsContent>
            </Tabs>

          </div>
        </div>
      </main>
    </div>
  );
}
