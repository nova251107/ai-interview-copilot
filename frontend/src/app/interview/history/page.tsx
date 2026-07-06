"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getClientHeaders } from "@/lib/api";
import {
  Brain, Loader2, Plus, ExternalLink, Trophy,
  Calendar, Briefcase, MessageSquare, ChevronRight,
  ClipboardList, Sparkles, TrendingUp, Search,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface InterviewSummary {
  id: string;
  role: string;
  score: number | null;
  createdAt: string;
  questions: Array<{ id: string; answer?: string | null }>;
}

/** Score badge color based on 0–10 scale */
function scoreBadge(score: number | null) {
  if (score == null)
    return { bg: "bg-white/10", text: "text-muted-foreground", label: "—" };
  const label = Number.isInteger(score) ? `${score}/10` : `${score.toFixed(1)}/10`;
  if (score >= 7) return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", label };
  if (score >= 5) return { bg: "bg-amber-500/20",   text: "text-amber-400",   border: "border-amber-500/30",   label };
  return             { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30",    label };
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Skeleton row for loading state */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/3 p-5 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded-full bg-white/10" />
        <div className="h-3 w-48 rounded-full bg-white/5" />
      </div>
      <div className="h-6 w-16 rounded-full bg-white/10" />
      <div className="h-8 w-24 rounded-xl bg-white/10" />
    </div>
  );
}

/** Empty state */
function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-indigo-500/20">
        <ClipboardList className="h-9 w-9 text-indigo-400" />
      </div>
      <h3 className="text-xl font-bold text-white">No interviews yet</h3>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Take your first AI mock interview and see your results here. Each session is saved automatically.
      </p>
      <button
        onClick={onStart}
        className="mt-8 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
      >
        <Sparkles className="h-4 w-4" />
        Start Your First Interview
      </button>
    </div>
  );
}

export default function InterviewHistoryPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (isLoaded && !isSignedIn) { router.push("/sign-in"); return; }
    if (!isLoaded || !user) return;

    const fetchHistory = async () => {
      try {
        const headers = await getClientHeaders(getToken, {
          id: user.id,
          name: user.fullName || user.firstName || "User",
          email: user.primaryEmailAddress?.emailAddress || "",
        });
        const res = await fetch(`${API_URL}/api/interviews/user/${user.id}/all`, {
          headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load interviews");
        // Already sorted newest-first by backend (orderBy: createdAt desc)
        setInterviews(data.interviews || []);
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error("Something went wrong");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isLoaded, isSignedIn, user, router]);

  // Compute summary stats
  const completedInterviews = interviews.filter(iv => iv.score != null);
  const avgScore =
    completedInterviews.length > 0
      ? completedInterviews.reduce((a, iv) => a + (iv.score ?? 0), 0) / completedInterviews.length
      : null;
  const bestScore =
    completedInterviews.length > 0
      ? Math.max(...completedInterviews.map(iv => iv.score ?? 0))
      : null;

  // Filter by search
  const filtered = interviews.filter(iv =>
    iv.role.toLowerCase().includes(search.toLowerCase())
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!isLoaded || loading) {
    return (
      <div className="relative min-h-screen bg-background p-6 sm:p-10">
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse space-y-3">
            <div className="h-8 w-52 rounded-xl bg-white/10" />
            <div className="h-4 w-72 rounded-full bg-white/5" />
          </div>
          <div className="space-y-3 pt-4">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-red-400 text-lg font-semibold">⚠️ {error}</p>
        <button
          onClick={() => router.push("/interview")}
          className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:scale-105 transition-all"
        >
          Back to Interview
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background p-6 sm:p-10">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl space-y-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/25">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Interview{" "}
                <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  History
                </span>
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {interviews.length === 0
                  ? "No interviews yet — take your first one!"
                  : `${interviews.length} session${interviews.length === 1 ? "" : "s"} · sorted by newest`}
              </p>
            </div>
          </div>

          {/* New Interview CTA */}
          <button
            onClick={() => router.push("/interview")}
            className="flex w-fit items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
          >
            <Plus className="h-4 w-4" /> New Interview
          </button>
        </div>

        {/* ── Stats Strip (shown when there's data) ── */}
        {interviews.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {/* Total sessions */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sessions</span>
              </div>
              <p className="text-3xl font-bold text-white">{interviews.length}</p>
            </div>

            {/* Avg score */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Score</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {avgScore != null ? (
                  <>
                    {Number.isInteger(avgScore) ? avgScore : avgScore.toFixed(1)}
                    <span className="text-base font-normal text-muted-foreground">/10</span>
                  </>
                ) : "—"}
              </p>
            </div>

            {/* Best score */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Best Score</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {bestScore != null ? (
                  <>
                    {Number.isInteger(bestScore) ? bestScore : bestScore.toFixed(1)}
                    <span className="text-base font-normal text-muted-foreground">/10</span>
                  </>
                ) : "—"}
              </p>
            </div>
          </div>
        )}

        {/* ── Interview List ── */}
        {interviews.length === 0 ? (
          <EmptyState onStart={() => router.push("/interview")} />
        ) : (
          <div className="space-y-5">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by role…"
                className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {/* Table header (desktop) */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center gap-6 px-5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
              <span className="flex items-center gap-1.5"><Briefcase className="h-3 w-3" /> Role</span>
              <span className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3" /> Questions</span>
              <span className="flex items-center gap-1.5"><Trophy className="h-3 w-3" /> Score</span>
              <span>Actions</span>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No interviews matching &quot;{search}&quot;
                </div>
              ) : (
                filtered.map((iv, idx) => {
                  const badge = scoreBadge(iv.score);
                  const questionCount = iv.questions?.length ?? 0;
                  const answeredCount = iv.questions?.filter(q => q.answer).length ?? 0;

                  return (
                    <div
                      key={iv.id}
                      className="group flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/8 sm:flex-row sm:items-center"
                    >
                      {/* Index + role info */}
                      <div className="flex flex-1 items-center gap-4 min-w-0">
                        {/* Number bubble */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/20 text-sm font-bold text-indigo-300">
                          {idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate">{iv.role}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(iv.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {answeredCount}/{questionCount} answered
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Questions count (desktop only — shown in meta on mobile) */}
                      <div className="hidden sm:flex items-center justify-center w-24">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-muted-foreground">
                          {questionCount} Qs
                        </span>
                      </div>

                      {/* Score badge */}
                      <div className="flex items-center gap-3 sm:w-24 sm:justify-center">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold border ${badge.bg} ${badge.text} ${(badge as { border?: string }).border ?? "border-white/10"}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      {/* View Results CTA */}
                      <div className="sm:shrink-0">
                        <button
                          onClick={() => router.push(`/interview/results/${iv.id}`)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-semibold text-indigo-300 transition-all hover:bg-indigo-500/20 hover:border-indigo-400/50 hover:text-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-500/10 sm:w-auto"
                        >
                          View Results
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer hint */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground/40">
                <span>Showing {filtered.length} of {interviews.length} sessions</span>
                <button
                  onClick={() => router.push("/interview")}
                  className="flex items-center gap-1 hover:text-indigo-400 transition-colors"
                >
                  New session <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
