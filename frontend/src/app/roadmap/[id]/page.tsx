"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getClientHeaders } from "@/lib/api";
import {
  Loader2, ArrowLeft, Calendar, BookOpen, Target,
  Link as LinkIcon, CheckCircle2, Award, Share2, Check,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type RoadmapData = {
  id: string;
  role: string;
  roadmapJson: {
    month1?: { title: string; weeks: Week[] };
    month2?: { title: string; weeks: Week[] };
    month3?: { title: string; weeks: Week[] };
    [key: string]: { title: string; weeks: Week[] } | undefined;
  };
};

type Week = {
  week: number;
  topics: string[];
  resources: string[];
  milestone: string;
};

export default function RoadmapView() {
  const { id } = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedWeeks, setCompletedWeeks] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem(`roadmap-progress-${id}`);
      if (saved) return new Set(JSON.parse(saved));
    } catch { /* ignore */ }
    return new Set();
  });
  const [linkCopied, setLinkCopied] = useState(false);
  const [collapsedMonths, setCollapsedMonths] = useState<Set<number>>(new Set());

  const storageKey = `roadmap-progress-${id}`;

  // Save progress to localStorage
  const saveProgress = useCallback((weeks: Set<string>) => {
    localStorage.setItem(storageKey, JSON.stringify([...weeks]));
  }, [storageKey]);

  const toggleWeek = (weekKey: string) => {
    setCompletedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekKey)) next.delete(weekKey);
      else next.add(weekKey);
      saveProgress(next);
      return next;
    });
  };

  const toggleMonth = (monthIdx: number) => {
    setCollapsedMonths(prev => {
      const next = new Set(prev);
      if (next.has(monthIdx)) next.delete(monthIdx);
      else next.add(monthIdx);
      return next;
    });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!id || !isSignedIn) return;

    const loadRoadmap = async () => {
      try {
        const headers = await getClientHeaders(getToken);
        const res = await fetch(`${API_URL}/api/roadmaps/${id}`, { headers });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setRoadmap(data.roadmap);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load roadmap";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadRoadmap();
  }, [id, isSignedIn]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-500/20 border-t-amber-500" />
          <p className="text-muted-foreground text-sm">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-6 py-4 text-center text-red-400 mb-6">
          ⚠️ {error || "Roadmap not found"}
        </div>
        <Link href="/roadmap" className="text-amber-400 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Roadmap Generator
        </Link>
      </div>
    );
  }

  const months = Object.keys(roadmap.roadmapJson)
    .filter((key) => key.startsWith("month"))
    .sort((a, b) => parseInt(a.replace("month", ""), 10) - parseInt(b.replace("month", ""), 10))
    .map((key) => roadmap.roadmapJson[key])
    .filter(Boolean) as { title: string; weeks: Week[] }[];

  // Compute total weeks and completed count
  const totalWeeks = months.reduce((sum, m) => sum + (m.weeks?.length || 0), 0);
  const completedCount = completedWeeks.size;
  const progressPercent = totalWeeks > 0 ? Math.round((completedCount / totalWeeks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background text-white pb-20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-gradient-to-b from-amber-500/10 to-transparent opacity-50 blur-3xl pointer-events-none" />
      </div>

      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        {/* Header Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/roadmap"
            className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
            >
              {linkCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
              {linkCopied ? "Copied!" : "Share"}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 shadow-inner">
              <Award className="h-4 w-4" /> {months.length} Months
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Your Path to{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {roadmap.role}
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            This personalized {totalWeeks}-week roadmap is designed to build your skills progressively.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-white">Overall Progress</span>
            </div>
            <span className="text-sm font-bold text-amber-400">
              {completedCount}/{totalWeeks} weeks · {progressPercent}%
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressPercent === 100 && (
            <p className="mt-3 text-center text-sm font-semibold text-emerald-400">
              🎉 Congratulations! You&apos;ve completed the entire roadmap!
            </p>
          )}
        </div>

        {/* Timeline Layout */}
        <div className="space-y-12">
          {months.map((monthData, mIndex) => {
            const isCollapsed = collapsedMonths.has(mIndex);
            const monthWeekKeys = monthData.weeks?.map((_, wIdx) => `m${mIndex}-w${wIdx}`) || [];
            const monthCompleted = monthWeekKeys.filter(k => completedWeeks.has(k)).length;
            const monthTotal = monthWeekKeys.length;

            return (
              <div key={mIndex} className="relative">
                {/* Month Header — clickable to collapse */}
                <button
                  onClick={() => toggleMonth(mIndex)}
                  className="mb-6 flex w-full items-center gap-4 text-left group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">Month {mIndex + 1}</h2>
                      <span className="text-xs font-medium text-muted-foreground rounded-full border border-white/10 px-2 py-0.5">
                        {monthCompleted}/{monthTotal} done
                      </span>
                    </div>
                    <p className="text-amber-400/80 font-medium">{monthData.title}</p>
                  </div>
                  <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isCollapsed ? "-rotate-90" : ""}`} />
                </button>

                {/* Weeks Grid — collapsible */}
                {!isCollapsed && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {monthData.weeks?.map((week, wIndex) => {
                      const weekKey = `m${mIndex}-w${wIndex}`;
                      const isDone = completedWeeks.has(weekKey);

                      return (
                        <div
                          key={wIndex}
                          className={`group relative flex flex-col rounded-2xl border p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                            isDone
                              ? "border-emerald-500/30 bg-emerald-500/5"
                              : "border-white/5 bg-white/3 hover:border-amber-500/30 hover:bg-white/5"
                          }`}
                        >
                          <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-lg font-bold text-white/90">Week {week.week}</span>
                            <button
                              onClick={() => toggleWeek(weekKey)}
                              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                                isDone
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {isDone ? "Done" : "Mark Done"}
                            </button>
                          </div>

                          <div className="flex-1 space-y-4">
                            {/* Topics */}
                            <div>
                              <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-400 mb-2">
                                <BookOpen className="h-4 w-4" /> Topics
                              </h4>
                              <ul className="space-y-1.5 ml-1">
                                {week.topics?.map((topic, i) => (
                                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/50" />
                                    <span className={`leading-relaxed ${isDone ? "line-through opacity-60" : ""}`}>{topic}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Resources */}
                            {week.resources && week.resources.length > 0 && (
                              <div>
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-orange-400 mb-2 mt-4">
                                  <LinkIcon className="h-4 w-4" /> Resources
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {week.resources.map((res, i) => (
                                    <span key={i} className="rounded-md bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70 border border-white/5">
                                      {res}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Milestone */}
                          <div className="mt-6 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 border border-amber-500/20">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-amber-500 mb-1">
                              <Target className="h-4 w-4" /> Milestone
                            </h4>
                            <p className="text-sm font-medium text-white/90">{week.milestone}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
