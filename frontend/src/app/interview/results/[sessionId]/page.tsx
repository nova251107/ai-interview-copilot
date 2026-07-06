"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getClientHeaders } from "@/lib/api";
import {
  Loader2, ArrowRight, Trophy, CheckCircle, MessageSquare, RefreshCw, History
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Question {
  id: string;
  question: string;
  questionType?: string;
  answer?: string;
  score?: number;
  feedback?: string;
}

interface Interview {
  id: string;
  role: string;
  score?: number;
  questions: Question[];
}

/** Returns Tailwind color classes based on 0–10 score */
function scoreColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 7) return { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" };
  if (score >= 5) return { bg: "bg-amber-500/20",   text: "text-amber-400",   border: "border-amber-500/30"  };
  return             { bg: "bg-red-500/20",    text: "text-red-400",    border: "border-red-500/30"    };
}

function ScoreGauge({ score }: { score: number }) {
  // score is 0-10 → clamp then multiply by 10 for visual
  const clamped = Math.min(Math.max(score, 0), 10);
  const visualPercent = clamped * 10; // 0-100 for the gauge arc

  const color =
    clamped >= 7 ? "#10B981" : clamped >= 5 ? "#FBBF24" : "#EF4444";
  const label =
    clamped >= 7 ? "Excellent" : clamped >= 5 ? "Good" : clamped >= 3 ? "Needs Work" : "Poor";

  // SVG circle: r=15.9155 → circumference ≈ 100
  const circumference = 100;
  const offset = circumference - (visualPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-36 w-36">
        <svg viewBox="0 0 36 36" className="-rotate-90 h-36 w-36">
          {/* Track */}
          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#ffffff10" strokeWidth="2.5" />
          {/* Progress */}
          <circle
            cx="18" cy="18" r="15.9155"
            fill="none"
            stroke={color}
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black" style={{ color }}>
            {Number.isInteger(clamped) ? clamped : clamped.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">/ 10</span>
        </div>
      </div>
      <span className="text-base font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

const QUESTION_TYPE_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  technical:    { label: "Technical",    bg: "bg-blue-500/20",   text: "text-blue-400"   },
  behavioral:   { label: "Behavioral",   bg: "bg-purple-500/20", text: "text-purple-400" },
  situational:  { label: "Situational",  bg: "bg-amber-500/20",  text: "text-amber-400"  },
};

export default function InterviewResult() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { sessionId } = useParams() as { sessionId: string };

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedAnswers, setExpandedAnswers] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isLoaded && !isSignedIn) { router.push("/sign-in"); return; }
    if (!isLoaded || !user) return;

    const fetch_ = async () => {
      try {
        const headers = await getClientHeaders(getToken, {
          id: user.id,
          name: user.fullName || user.firstName || "User",
          email: user.primaryEmailAddress?.emailAddress || "",
        });
        const res = await fetch(`${API_URL}/api/interviews/${sessionId}`, {
          headers,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load results");
        setInterview(data.interview);
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error("Something went wrong");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [isLoaded, isSignedIn, user, sessionId, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
        <p className="text-muted-foreground text-sm">Calculating your results...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-red-400 text-lg font-semibold">⚠️ {error || "Results not found"}</p>
        <button onClick={() => router.push("/interview")}
          className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:scale-105 transition-all">
          Back to Role Selection
        </button>
      </div>
    );
  }

  // Overall score: use interview.score (0–10) or compute from questions
  const overallScore: number =
    interview.score != null
      ? interview.score
      : interview.questions.filter(q => q.score != null).length > 0
        ? interview.questions.filter(q => q.score != null).reduce((a, q) => a + (q.score ?? 0), 0) /
          interview.questions.filter(q => q.score != null).length
        : 0;

  const answeredQuestions = interview.questions.filter(q => q.answer);

  const toggleAnswer = (id: string) =>
    setExpandedAnswers(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="relative min-h-screen bg-background p-6 sm:p-10">
      {/* Background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-2xl space-y-6">

        {/* ── Score Card ── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-400" />
            <h1 className="text-2xl font-bold text-white">Interview Complete!</h1>
          </div>
          <p className="mb-6 text-muted-foreground text-sm">
            Role:{" "}
            <span className="font-semibold text-white">{interview.role}</span>
            <span className="ml-3 text-muted-foreground/50">·</span>
            <span className="ml-3 text-muted-foreground/70">{interview.questions.length} questions</span>
          </p>
          <ScoreGauge score={overallScore} />
        </div>

        {/* ── Per-question Feedback ── */}
        {answeredQuestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-indigo-400" />
              <h2 className="text-lg font-semibold text-white">Per‑Question Feedback</h2>
            </div>

            {interview.questions.map((q, idx) => {
              const colors = q.score != null ? scoreColor(q.score) : null;
              const typeStyle = q.questionType ? QUESTION_TYPE_STYLES[q.questionType.toLowerCase()] : null;
              const isExpanded = expandedAnswers[q.id] ?? false;
              const answerTruncated = q.answer && q.answer.length > 200;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl border bg-white/5 p-5 backdrop-blur-sm transition-all ${
                    colors ? colors.border : "border-white/10"
                  }`}
                >
                  {/* Header row: question + type badge + score badge */}
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium text-white text-sm leading-relaxed flex-1">
                      <span className="text-indigo-400 font-bold">Q{idx + 1}:</span>{" "}
                      {q.question}
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      {/* Question type badge */}
                      {typeStyle && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${typeStyle.bg} ${typeStyle.text}`}>
                          {typeStyle.label}
                        </span>
                      )}
                      {/* Score badge */}
                      {q.score != null && colors && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${colors.bg} ${colors.text}`}>
                          {Number.isInteger(q.score) ? q.score : q.score.toFixed(1)}/10
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Answer — full, with expand/collapse for very long ones */}
                  {q.answer && (
                    <div className="mt-3 rounded-xl border border-white/5 bg-white/3 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1.5">
                        Your Answer
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {answerTruncated && !isExpanded
                          ? q.answer.slice(0, 200) + "…"
                          : q.answer}
                      </p>
                      {answerTruncated && (
                        <button
                          onClick={() => toggleAnswer(q.id)}
                          className="mt-1.5 text-[10px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          {isExpanded ? "Show less ↑" : "Show more ↓"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* AI Feedback */}
                  {q.feedback && (
                    <div className="mt-3 flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{q.feedback}</p>
                    </div>
                  )}

                  {/* Unanswered indicator */}
                  {!q.answer && (
                    <p className="mt-2 text-xs text-muted-foreground/40 italic">Not answered</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Action Buttons ── */}
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            onClick={() => router.push("/interview")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Practice Another
          </button>
          <button
            onClick={() => router.push("/interview/history")}
            className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-sm font-medium text-indigo-300 hover:bg-indigo-500/20 transition-all"
          >
            <History className="h-4 w-4" /> View History
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="ml-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-all"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
