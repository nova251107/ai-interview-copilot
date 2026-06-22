"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  Loader2, ArrowRight, ArrowLeft, CheckCircle, Brain, Mic
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Question {
  id: string;
  question: string;
  answer?: string;
  score?: number;
  feedback?: string;
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const percent = total > 0 ? Math.round((step / total) * 100) : 0;
  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Question {step} of {total}</span>
        <span className="text-indigo-400 font-medium">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/5">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function InterviewSession() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const { sessionId } = useParams() as { sessionId: string };

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && !isSignedIn) { router.push("/sign-in"); return; }
    if (!isLoaded || !user) return;

    // Fetch existing interview from backend
    const fetchInterview = async () => {
      try {
        const res = await fetch(`${API_URL}/api/interviews/${sessionId}`, {
          headers: {
            "x-user-id": user.id,
            "x-user-name": user.fullName || user.firstName || "User",
            "x-user-email": user.primaryEmailAddress?.emailAddress || "",
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load interview");
        setQuestions(data.interview.questions || []);
        // Pre-fill any previously answered questions
        const prefill: Record<string, string> = {};
        (data.interview.questions || []).forEach((q: Question) => {
          if (q.answer) prefill[q.id] = q.answer;
        });
        setAnswers(prefill);
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error("Something went wrong");
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [isLoaded, isSignedIn, user, sessionId, router]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] || "") : "";

  const handleAnswerChange = (text: string) => {
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: text }));
  };

  // Submit answer for current question to backend
  const submitCurrentAnswer = async () => {
    if (!currentQuestion || !currentAnswer.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await fetch(`${API_URL}/api/interviews/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          "x-user-name": user?.fullName || user?.firstName || "User",
          "x-user-email": user?.primaryEmailAddress?.emailAddress || "",
        },
        body: JSON.stringify({
          interviewId: sessionId,
          questionId: currentQuestion.id,
          answer: currentAnswer,
        }),
      });
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error("Something went wrong");
      setError(err.message);
    }
    setSubmitting(false);
  };

  const goNext = async () => {
    await submitCurrentAnswer();
    if (currentIndex + 1 >= questions.length) {
      // All questions answered — go to results
      router.push(`/interview/results/${sessionId}`);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-400" />
        <p className="text-muted-foreground text-sm">Loading your interview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <p className="text-red-400 text-lg font-semibold">⚠️ {error}</p>
        <button
          onClick={() => router.push("/interview")}
          className="mt-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:scale-105 transition-all"
        >
          Back to Role Selection
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
      </div>

      <div className="mx-auto max-w-2xl">
        {/* Top bar */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Brain className="h-4 w-4 text-indigo-400" />
            <span>AI Mock Interview</span>
          </div>
          <span className="text-xs text-muted-foreground/50">Session: {sessionId.slice(0, 8)}…</span>
        </div>

        <ProgressBar step={currentIndex + 1} total={questions.length} />

        {/* Question card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500">
              <Mic className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-indigo-400 mb-2">
                Question {currentIndex + 1}
              </p>
              <h2 className="text-xl font-semibold text-white leading-relaxed">
                {currentQuestion?.question}
              </h2>
            </div>
          </div>

          <textarea
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            rows={7}
            placeholder="Type your answer here..."
            className="w-full rounded-xl border border-white/10 bg-white/3 px-4 py-3 text-white placeholder-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
          />

          {/* Error */}
          {error && (
            <p className="mt-3 text-sm text-red-400">⚠️ {error}</p>
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" /> Previous
            </button>

            <button
              onClick={goNext}
              disabled={submitting || !currentAnswer.trim()}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : currentIndex + 1 >= questions.length ? (
                <><CheckCircle className="h-4 w-4" /> Submit Interview</>
              ) : (
                <>Next <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>

        {/* Quick tips */}
        <p className="mt-4 text-center text-xs text-muted-foreground/50">
          💡 Take your time — answers are saved before moving to the next question.
        </p>
      </div>
    </div>
  );
}
