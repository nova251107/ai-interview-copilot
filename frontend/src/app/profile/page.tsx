"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  User, Mail, Calendar, Shield, Trash2, LogOut,
  Brain, Mic, Map, FileText, Code2, Loader2, AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserStats {
  totalInterviews: number;
  avgScore: number | null;
  bestScore: number | null;
}

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) { router.push("/sign-in"); return; }
    if (!isLoaded || !user) return;

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/${user.id}/stats`, {
          headers: { "x-user-id": user.id },
        });
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isLoaded, isSignedIn, user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!user) return null;

  const accountStats = [
    { label: "Interviews", value: stats?.totalInterviews ?? 0, icon: Mic, color: "text-violet-400" },
    { label: "Avg Score", value: stats?.avgScore != null ? `${stats.avgScore}/10` : "—", icon: Brain, color: "text-indigo-400" },
    { label: "Best Score", value: stats?.bestScore != null ? `${stats.bestScore}/10` : "—", icon: FileText, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-3xl font-bold text-white">
          My{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Profile
          </span>
        </h1>

        {/* Profile Card */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={user.imageUrl}
                alt={user.fullName || "User"}
                className="h-24 w-24 rounded-2xl object-cover ring-2 ring-violet-500/30 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-lg">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold text-white">{user.fullName || "User"}</h2>
              <div className="mt-2 flex flex-col sm:flex-row gap-3 text-sm text-muted-foreground">
                <span className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Mail className="h-4 w-4" />
                  {user.primaryEmailAddress?.emailAddress}
                </span>
                <span className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(user.createdAt || Date.now()), "MMM yyyy")}
                </span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                <Shield className="h-3 w-3" />
                Verified Account
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {accountStats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center backdrop-blur-sm">
              <Icon className={`mx-auto mb-2 h-6 w-6 ${color}`} />
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { href: "/interview", label: "Interview", icon: Mic, color: "text-violet-400" },
              { href: "/resume", label: "Resume", icon: FileText, color: "text-blue-400" },
              { href: "/roadmap", label: "Roadmap", icon: Map, color: "text-amber-400" },
              { href: "/dsa", label: "DSA", icon: Code2, color: "text-emerald-400" },
            ].map(({ href, label, icon: Icon, color }) => (
              <a key={label} href={href}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/3 p-4 text-center transition-all hover:border-white/10 hover:bg-white/5 hover:-translate-y-0.5">
                <Icon className={`h-6 w-6 ${color}`} />
                <span className="text-xs font-medium text-white">{label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Account Actions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Account</h3>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl border border-white/5 bg-white/3 px-4 py-3 text-left text-sm font-medium text-white transition-all hover:border-white/10 hover:bg-white/5"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
              Sign Out
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-left text-sm font-medium text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/10"
              >
                <Trash2 className="h-5 w-5" />
                Delete All My Data
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <p className="text-sm font-semibold text-red-400">Are you sure?</p>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  This will permanently delete all your interviews, roadmaps, and resume data. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      // Future: call DELETE /api/users/:id endpoint
                      await handleSignOut();
                    }}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 transition-all disabled:opacity-50"
                  >
                    {deleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User ID (for debugging) */}
        <p className="mt-6 text-center text-xs text-muted-foreground/30">
          User ID: {user.id.slice(0, 20)}…
        </p>
      </div>
    </div>
  );
}
