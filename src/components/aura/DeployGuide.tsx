"use client";

import { Rocket, Globe, Server, Terminal, Copy, Check, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/store/app";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function CodeBlock({ children, id }: { children: string; id: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const copy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    toast({ title: "Copied!" });
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-xs overflow-x-auto">
      <button
        onClick={copy}
        className="absolute top-2 right-2 rounded-md bg-white/10 p-1.5 hover:bg-white/20"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <pre className="pr-8 whitespace-pre-wrap break-all">{children}</pre>
    </div>
  );
}

export function DeployGuide() {
  const { deployOpen, setDeployOpen } = useApp();

  return (
    <Dialog open={deployOpen} onOpenChange={setDeployOpen}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto bg-card border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="h-5 w-5 text-amber-300" /> Publish AuraMedia online
          </DialogTitle>
          <DialogDescription>
            AuraMedia is a standard Next.js 16 app. Pick a host below, follow the steps, and your
            social network will be live on a real domain in minutes.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="vercel">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="vercel"><Globe className="h-4 w-4 mr-1.5" />Vercel + Turso</TabsTrigger>
            <TabsTrigger value="railway"><Server className="h-4 w-4 mr-1.5" />Railway</TabsTrigger>
            <TabsTrigger value="vps"><Terminal className="h-4 w-4 mr-1.5" />VPS</TabsTrigger>
          </TabsList>

          {/* VERCEL + TURSO (the correct, persistent path) */}
          <TabsContent value="vercel" className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
              <p className="font-medium text-emerald-300">Recommended · Free tier · Persistent DB · Auto HTTPS</p>
              <p className="text-xs text-emerald-200/80 mt-0.5">
                Vercel hosts the app, Turso hosts a free cloud SQLite database. Together they give you a
                real, persistent social network where user signups survive forever.
              </p>
            </div>

            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs">
              <p className="font-semibold text-rose-300 mb-1">⚠ Why you MUST use Turso (not plain SQLite)</p>
              <p className="text-rose-100/90">
                Vercel's serverless filesystem is <b>read-only</b>. A local SQLite file (<code>file:./prod.db</code>)
                throws <i>"Unable to open the database file"</i> on every login/signup. Turso is a cloud
                SQLite that works perfectly on Vercel. The app auto-detects a <code>libsql://</code> URL.
              </p>
            </div>

            <Step n={1} title="Push the code to GitHub">
              <CodeBlock id="v1">{`git init && git add . && git commit -m "AuraMedia"
# create an empty repo on github.com first, then:
git remote add origin https://github.com/YOU/auramedia.git
git push -u origin main`}</CodeBlock>
            </Step>

            <Step n={2} title="Create a free Turso database (2 min, persistent cloud SQLite)">
              Sign up at{" "}
              <a className="text-primary underline" href="https://turso.tech" target="_blank" rel="noreferrer">
                turso.tech <ExternalLink className="inline h-3 w-3" />
              </a>{" "}
              (free tier: 500 DBs, 9GB). Then run:
              <div className="mt-2">
                <CodeBlock id="v2">{`# install the Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# log in & create a database called "auramedia"
turso auth login
turso db create auramedia

# get your connection URL + auth token
turso db show auramedia --url
turso db tokens create auramedia`}</CodeBlock>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                You'll get a URL like <code>libsql://auramedia-xxx.turso.io</code> and a token string. Keep both.
              </p>
            </Step>

            <Step n={3} title="Import on Vercel">
              Go to{" "}
              <a className="text-primary underline" href="https://vercel.com/new" target="_blank" rel="noreferrer">
                vercel.com/new <ExternalLink className="inline h-3 w-3" />
              </a>{" "}
              → pick your GitHub repo → keep all defaults → click <b>Deploy</b>.
            </Step>

            <Step n={4} title="Set environment variables in Vercel">
              Vercel → Project → Settings → Environment Variables → add these 3 (for Production + Preview):
              <div className="mt-2">
                <CodeBlock id="v3">{`DATABASE_URL   =  libsql://auramedia-xxx.turso.io
LIBSQL_TOKEN   =  eyJ...your-token-from-step-2...
AURA_SECRET    =  any-long-random-string-eg-$(openssl rand -hex 32)`}</CodeBlock>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                <b>Redeploy</b> after adding the variables (Deployments → latest → ⋯ → Redeploy).
              </p>
            </Step>

            <Step n={5} title="Create the tables + Admin account (one-time)">
              Run locally with your Turso URL so the schema + seed land in the cloud DB:
              <div className="mt-2">
                <CodeBlock id="v4">{`export DATABASE_URL="libsql://auramedia-xxx.turso.io"
export LIBSQL_TOKEN="your-token"
bunx prisma db push
bun run scripts/seed.ts`}</CodeBlock>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                This creates the <code>Admin</code> account. The default password is in your private
                handover notes — <b>change it immediately</b> in Admin → Settings once you log in.
              </p>
            </Step>

            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs">
              <b>Without Turso</b> the app still boots (it auto-copies a bundled seed DB to Vercel's
              <code> /tmp</code> on cold start) so you can browse — but <b>user signups won't persist</b>
              across cold starts. Turso fixes that. It's free and takes 2 minutes.
            </div>
          </TabsContent>

          {/* RAILWAY (Postgres) */}
          <TabsContent value="railway" className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 p-3">
              <p className="font-medium text-fuchsia-300">All-in-one · Free trial · Persistent Postgres</p>
              <p className="text-xs text-fuchsia-200/80 mt-0.5">
                Railway gives you a container + a Postgres DB in one project. Good if you prefer Postgres over SQLite.
              </p>
            </div>
            <Step n={1} title="Push code to GitHub (same as Vercel step 1).">
              <CodeBlock id="r1">{`git init && git add . && git commit -m "AuraMedia"
git remote add origin https://github.com/YOU/auramedia.git
git push -u origin main`}</CodeBlock>
            </Step>
            <Step n={2} title="Create a project on Railway">
              Go to{" "}
              <a className="text-primary underline" href="https://railway.app/new" target="_blank" rel="noreferrer">
                railway.app/new <ExternalLink className="inline h-3 w-3" />
              </a>{" "}
              → <b>Deploy from GitHub repo</b> → pick your repo.
            </Step>
            <Step n={3} title="Add a PostgreSQL database">
              In the project → <b>New → Database → Add PostgreSQL</b>. Railway gives you a{" "}
              <code>DATABASE_URL</code> automatically.
            </Step>
            <Step n={4} title="Switch the Prisma provider to postgresql & set env">
              In <code>prisma/schema.prisma</code> change <code>provider = "sqlite"</code> to{" "}
              <code>provider = "postgresql"</code>, commit, push. Then in Railway → Variables:
              <div className="mt-2">
                <CodeBlock id="r2">{`DATABASE_URL=\${{Postgres.DATABASE_URL}}
AURA_SECRET=<long random string>`}</CodeBlock>
              </div>
            </Step>
            <Step n={5} title="Set the start command & build">
              In the service → Settings:
              <div className="mt-2">
                <CodeBlock id="r3">{`Build:  bun install && bunx prisma generate && bunx prisma db push && bun run scripts/seed.ts && bun run build
Start:  bun .next/standalone/server.js`}</CodeBlock>
              </div>
            </Step>
            <Step n={6} title="Generate a public domain">
              Settings → Networking → <b>Generate Domain</b>. Your app is now live at
              <code> https://auramedia.up.railway.app</code>.
            </Step>
          </TabsContent>

          {/* VPS */}
          <TabsContent value="vps" className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-3">
              <p className="font-medium text-sky-300">Full control · ~$5/mo · any VPS (Hetzner, DigitalOcean, etc.)</p>
              <p className="text-xs text-sky-200/80 mt-0.5">
                You rent a server, install Bun, run AuraMedia behind Caddy with HTTPS. SQLite file works fine here (persistent disk).
              </p>
            </div>
            <Step n={1} title="Provision a server (Ubuntu 22+) and SSH in.">
              <CodeBlock id="vp1">{`ssh root@YOUR_SERVER_IP`}</CodeBlock>
            </Step>
            <Step n={2} title="Install Bun + clone the repo">
              <CodeBlock id="vp2">{`curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
git clone https://github.com/YOU/auramedia.git
cd auramedia
bun install`}</CodeBlock>
            </Step>
            <Step n={3} title="Set env & build">
              <CodeBlock id="vp3">{`export DATABASE_URL="file:/root/auramedia/db/prod.db"
export AURA_SECRET="$(openssl rand -hex 32)"
bunx prisma db push
bun run scripts/seed.ts
bun run build`}</CodeBlock>
            </Step>
            <Step n={4} title="Run with a process manager (PM2/systemd)">
              <CodeBlock id="vp4">{`bunx pm2 start "bun .next/standalone/server.js" --name auramedia
bunx pm2 save && bunx pm2 startup`}</CodeBlock>
            </Step>
            <Step n={5} title="Point a domain + HTTPS with Caddy">
              <CodeBlock id="vp5">{`# /etc/caddy/Caddyfile
auramedia.yourdomain.com {
  reverse_proxy localhost:3000
}`}</CodeBlock>
              <CodeBlock id="vp6">{`systemctl reload caddy`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                Caddy auto-provisions a Let's Encrypt TLS certificate. Done — visit
                <code> https://auramedia.yourdomain.com</code>.
              </p>
            </Step>
          </TabsContent>
        </Tabs>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs">
          <p className="font-semibold text-amber-300 mb-1">After going live — do these 4 things:</p>
          <ol className="list-decimal list-inside space-y-1 text-amber-100/90">
            <li>Log in as <code>Admin</code> with the password from your private handover notes, then change it in <b>Admin → Settings</b> immediately.</li>
            <li>Set a strong <code>AURA_SECRET</code> env var (signs your session cookies).</li>
            <li>Use Turso/Postgres for the database — plain SQLite does NOT persist on Vercel.</li>
            <li>Review the AuraGuard moderation queue regularly — AI catches most sketchy posts, but the Admin has the final call.</li>
          </ol>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="secondary">Next.js 16</Badge>
          <Badge variant="secondary">Prisma + Turso/SQLite</Badge>
          <Badge variant="secondary">AuraGuard AI moderation</Badge>
          <Badge variant="secondary">Verification badges</Badge>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="shrink-0 h-6 w-6 rounded-full aura-gradient-bg text-white text-xs font-bold flex items-center justify-center">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium mb-1.5">{title}</p>
        <div className="space-y-2">{children}</div>
      </div>
    </div>
  );
}
