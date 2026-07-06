"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import { getClientHeaders } from "@/lib/api";
import {
  Loader2, Briefcase, BarChart2, Package, Palette,
  ChevronRight, Sparkles, Zap, Brain, Hash
} from "lucide-react";

const ROLES = [
  { title: "Software Engineer", icon: Briefcase, color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
  { title: "Data Scientist", icon: BarChart2, color: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/20" },
  { title: "Product Manager", icon: Package, color: "from-emerald-500 to-teal-500", shadow: "shadow-emerald-500/20" },
  { title: "UI/UX Designer", icon: Palette, color: "from-rose-500 to-pink-500", shadow: "shadow-rose-500/20" },
];

const QUESTION_COUNTS = [5, 10, 15] as const;
type QuestionCount = typeof QUESTION_COUNTS[number];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function InterviewHome() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  const startInterview = async (jobRole: string) => {
    if (!user) return;
    setLoading(jobRole);
    setError("");
    toast.loading(`Generating ${questionCount} questions for ${jobRole}…`, { id: "start" });
    try {
      const headers = await getClientHeaders(getToken, {
        id: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
      const res = await fetch(`${API_URL}/api/interviews/start`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobRole, questionCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start interview");
      toast.success(`Interview ready! ${questionCount} questions loaded.`, { id: "start" });
      router.push(`/interview/session/${data.interviewId}`);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error("Something went wrong");
      toast.error(err.message || "Something went wrong.", { id: "start" });
      setError(err.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(null);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1a2e",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
          },
        }}
      />
      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-lg shadow-indigo-500/25">
            <Brain className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">
            Mock{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Interview
            </span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Choose your target role and let AI simulate a real interview experience.
          </p>
          <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground/60">
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> AI‑generated questions</span>
            <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> Instant feedback</span>
          </div>
        </div>

        {/* Question Count Selector */}
        <div className="mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Hash className="h-4 w-4 text-indigo-400" />
            <p className="text-sm font-medium text-white/80">Number of Questions</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            {QUESTION_COUNTS.map((count) => (
              <button
                key={count}
                id={`question-count-${count}`}
                onClick={() => setQuestionCount(count)}
                disabled={loading !== null}
                className={`relative flex flex-col items-center justify-center w-24 h-20 rounded-2xl border transition-all duration-300 disabled:cursor-not-allowed
                  ${questionCount === count
                    ? "border-indigo-500/60 bg-indigo-500/20 shadow-lg shadow-indigo-500/20 scale-105"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8 hover:scale-102"
                  }`}
              >
                <span className={`text-2xl font-bold transition-colors duration-300 ${questionCount === count ? "text-indigo-300" : "text-white/60"}`}>
                  {count}
                </span>
                <span className={`text-xs mt-1 transition-colors duration-300 ${questionCount === count ? "text-indigo-400/80" : "text-muted-foreground/50"}`}>
                  {count === 5 ? "Quick" : count === 10 ? "Standard" : "Deep Dive"}
                </span>
                {questionCount === count && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] text-white font-bold shadow">
                    ✓
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Role cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {ROLES.map(({ title, icon: Icon, color, shadow }) => (
            <button
              key={title}
              id={`role-${title.toLowerCase().replace(/\//g, "-").replace(/\s+/g, "-")}`}
              onClick={() => startInterview(title)}
              disabled={loading !== null}
              className={`group relative flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/8 hover:scale-[1.02] hover:shadow-xl ${shadow} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">{title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {questionCount} AI questions · instant scoring
                </p>
              </div>
              {loading === title ? (
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
              )}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            ⚠️ {error}
          </div>
        )}
      </div>
    </div>
  );
}
