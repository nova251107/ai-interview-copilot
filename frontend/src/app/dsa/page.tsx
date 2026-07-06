"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getClientHeaders } from "@/lib/api";
import {
  Loader2, Code2, RefreshCw, CheckCircle2,
  Trophy, ExternalLink, Link2, ShieldCheck, AlertCircle,
  PlusCircle, ChevronDown, ChevronUp, Send, X
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type DSAStats = {
  easy: number;
  medium: number;
  hard: number;
  leetcodeUsername?: string | null;
};

type Difficulty = "Easy" | "Medium" | "Hard";
type ProblemStatus = "Solved" | "Attempted" | "Skipped";

const DIFFICULTY_STYLES: Record<Difficulty, { color: string; bg: string; border: string }> = {
  Easy:   { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  Medium: { color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  Hard:   { color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30"     },
};

export default function DSATracker() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<DSAStats>({ easy: 0, medium: 0, hard: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lcUsername, setLcUsername] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ── Log Problem form state ──────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [problemName, setProblemName] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Easy");
  const [problemStatus, setProblemStatus] = useState<ProblemStatus>("Solved");
  const [logLoading, setLogLoading] = useState(false);
  const [logSuccess, setLogSuccess] = useState("");
  const [logError, setLogError] = useState("");

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn || !user) return;
    const loadDSAStats = async () => {
      try {
        const headers = await getClientHeaders(getToken);
        const res = await fetch(`${API_URL}/api/dsa/user/${user.id}`, { headers });
        const data = await res.json();
        if (data.success && data.dsa) {
          setStats({
            easy: data.dsa.easy || 0,
            medium: data.dsa.medium || 0,
            hard: data.dsa.hard || 0,
            leetcodeUsername: data.dsa.leetcodeUsername || null,
          });
          if (data.dsa.leetcodeUsername) {
            setLcUsername(data.dsa.leetcodeUsername);
          }
        }
      } catch {
        setError("Failed to load DSA stats");
      } finally {
        setLoading(false);
      }
    };
    loadDSAStats();
  }, [isSignedIn, user]);

  const handleSync = async () => {
    if (!user || !lcUsername.trim()) return;
    setSyncing(true);
    setError("");
    setSuccessMsg("");

    try {
      const headers = await getClientHeaders(getToken, {
        id: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
      const res = await fetch(`${API_URL}/api/dsa/sync`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leetcodeUsername: lcUsername.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sync failed");

      setStats({
        easy: data.dsa.easy,
        medium: data.dsa.medium,
        hard: data.dsa.hard,
        leetcodeUsername: data.dsa.leetcodeUsername,
      });
      setSuccessMsg(`✅ Synced ${data.lcStats.totalSolved} real problems from @${data.dsa.leetcodeUsername}!`);
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error("Something went wrong");
      setError(err.message || "Something went wrong.");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !problemName.trim()) return;

    setLogLoading(true);
    setLogError("");
    setLogSuccess("");

    try {
      const headers = await getClientHeaders(getToken, {
        id: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
      const res = await fetch(`${API_URL}/api/dsa/log`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          problemName: problemName.trim(),
          difficulty,
          status: problemStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to log problem");

      // Update stats optimistically if the problem was solved
      if (problemStatus === "Solved") {
        const key = difficulty.toLowerCase() as "easy" | "medium" | "hard";
        setStats(prev => ({ ...prev, [key]: prev[key] + 1 }));
      }

      setLogSuccess(`✅ "${problemName}" logged as ${problemStatus}!`);
      setProblemName("");
      setDifficulty("Easy");
      setProblemStatus("Solved");
      setTimeout(() => {
        setLogSuccess("");
        setFormOpen(false);
      }, 3000);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error("Something went wrong");
      setLogError(err.message || "Could not log problem. Is the backend running?");
    } finally {
      setLogLoading(false);
    }
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setProblemName("");
    setDifficulty("Easy");
    setProblemStatus("Solved");
    setLogError("");
    setLogSuccess("");
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
      </div>
    );
  }

  const totalSolved = stats.easy + stats.medium + stats.hard;
  const isVerified = !!stats.leetcodeUsername;

  const difficulties = [
    {
      key: "easy" as const,
      label: "Easy",
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      glow: "hover:shadow-emerald-500/10",
      total: 839,
    },
    {
      key: "medium" as const,
      label: "Medium",
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      glow: "hover:shadow-amber-500/10",
      total: 1759,
    },
    {
      key: "hard" as const,
      label: "Hard",
      color: "text-red-400",
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      glow: "hover:shadow-red-500/10",
      total: 762,
    },
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden pb-20">
      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-teal-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-16 sm:px-6">

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/25">
            <Code2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            DSA{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Tracker
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect your LeetCode account to track your{" "}
            <span className="text-emerald-400 font-medium">real, verified</span> progress.
          </p>
        </div>

        {/* LeetCode Sync Card */}
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Link2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Sync with LeetCode</h2>
              <p className="text-sm text-muted-foreground">Enter your username — we&apos;ll fetch your real data directly from LeetCode</p>
            </div>
            {isVerified && (
              <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                leetcode.com/u/
              </span>
              <input
                type="text"
                placeholder="your-username"
                value={lcUsername}
                onChange={(e) => setLcUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSync()}
                disabled={syncing}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-36 pr-4 text-white placeholder:text-muted-foreground/40 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50"
              />
            </div>
            <button
              onClick={handleSync}
              disabled={syncing || !lcUsername.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {syncing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
              {syncing ? "Syncing..." : "Sync Now"}
            </button>
          </div>

          {/* Link to LeetCode profile */}
          {isVerified && (
            <a
              href={`https://leetcode.com/u/${stats.leetcodeUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1.5 text-sm text-emerald-400/70 hover:text-emerald-400 transition-colors w-fit"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View @{stats.leetcodeUsername}&apos;s LeetCode profile
            </a>
          )}

          {/* Sync Feedback messages */}
          {successMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* ── Log Problem Section ─────────────────────────────────────────────── */}
        <div className="mb-10">
          {/* Toggle Button */}
          <button
            onClick={() => (formOpen ? handleCloseForm() : setFormOpen(true))}
            className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-5 py-4 font-semibold text-sm transition-all duration-300 ${
              formOpen
                ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                : "border-white/10 bg-white/5 text-white hover:bg-white/8 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <PlusCircle className={`h-5 w-5 transition-colors ${formOpen ? "text-violet-400" : "text-muted-foreground"}`} />
              <span>Log a Problem Manually</span>
              <span className="text-xs font-normal text-muted-foreground">
                — track problems outside LeetCode
              </span>
            </div>
            {formOpen
              ? <ChevronUp className="h-4 w-4 text-violet-400 shrink-0" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            }
          </button>

          {/* Expandable Form */}
          {formOpen && (
            <div className="mt-2 rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-6 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Log a Problem</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Manually record a problem you&apos;ve worked on from any source
                  </p>
                </div>
                <button
                  onClick={handleCloseForm}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <form onSubmit={handleLogProblem} className="space-y-4">
                {/* Problem Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Problem Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Two Sum, Binary Search, LRU Cache…"
                    value={problemName}
                    onChange={(e) => setProblemName(e.target.value)}
                    required
                    disabled={logLoading}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-muted-foreground/40 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Difficulty */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Difficulty
                    </label>
                    <div className="relative">
                      <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                        disabled={logLoading}
                        className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50 cursor-pointer"
                      >
                        <option value="Easy"   className="bg-[#1e1e2e]">🟢 Easy</option>
                        <option value="Medium" className="bg-[#1e1e2e]">🟡 Medium</option>
                        <option value="Hard"   className="bg-[#1e1e2e]">🔴 Hard</option>
                      </select>
                      {/* Difficulty colour pill */}
                      <div className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${DIFFICULTY_STYLES[difficulty].color} ${DIFFICULTY_STYLES[difficulty].bg} ${DIFFICULTY_STYLES[difficulty].border}`}>
                        {difficulty}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </label>
                    <select
                      value={problemStatus}
                      onChange={(e) => setProblemStatus(e.target.value as ProblemStatus)}
                      disabled={logLoading}
                      className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30 disabled:opacity-50 cursor-pointer"
                    >
                      <option value="Solved"    className="bg-[#1e1e2e]">✅ Solved</option>
                      <option value="Attempted" className="bg-[#1e1e2e]">🔄 Attempted</option>
                      <option value="Skipped"   className="bg-[#1e1e2e]">⏭️ Skipped</option>
                    </select>
                  </div>
                </div>

                {/* Feedback messages */}
                {logSuccess && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {logSuccess}
                  </div>
                )}
                {logError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {logError}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={logLoading || !problemName.trim()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {logLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Logging…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Log Problem
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Total Solved */}
        <div className="mb-10 flex justify-center">
          <div className="relative flex flex-col items-center justify-center h-44 w-44 rounded-full border-[3px] border-emerald-500/20 bg-white/3 backdrop-blur-md shadow-2xl shadow-emerald-500/5">
            <Trophy className="h-7 w-7 text-emerald-400 mb-1" />
            <span className="text-5xl font-bold text-white">{totalSolved}</span>
            <span className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-widest">Solved</span>
            {isVerified && (
              <span className="absolute -bottom-3 flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                <ShieldCheck className="h-2.5 w-2.5" /> VERIFIED
              </span>
            )}
          </div>
        </div>

        {/* Difficulty Cards */}
        <div className="grid gap-5 sm:grid-cols-3">
          {difficulties.map(({ key, label, color, border, bg, glow, total }) => {
            const solved = stats[key];
            const pct = Math.min(100, Math.round((solved / total) * 100));

            return (
              <div
                key={key}
                className={`group flex flex-col rounded-2xl border ${border} bg-white/3 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${glow}`}
              >
                {/* Label + Badge */}
                <div className="mb-5 flex items-center justify-between">
                  <h3 className={`text-lg font-bold ${color}`}>{label}</h3>
                  {isVerified && (
                    <span className={`rounded-full ${bg} ${color} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${border}`}>
                      Real
                    </span>
                  )}
                </div>

                {/* Big count */}
                <div className="mb-1">
                  <span className="text-5xl font-bold text-white">{solved}</span>
                  <span className="text-sm text-muted-foreground ml-2">/ {total}</span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${bg.replace('/10', '/60')}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className={`mt-2 text-xs font-medium ${color}`}>{pct}% complete</p>
              </div>
            );
          })}
        </div>

        {/* Info note */}
        {!isVerified && (
          <p className="mt-8 text-center text-sm text-muted-foreground/50">
            ℹ️ Enter your LeetCode username above to load your real, verified stats.
          </p>
        )}

      </div>
    </div>
  );
}
