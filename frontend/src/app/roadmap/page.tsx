"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { getClientHeaders } from "@/lib/api";
import {
  Loader2, Briefcase, Code, Database, Palette,
  ChevronRight, Map, Compass, Search
} from "lucide-react";

const ROLES = [
  { title: "Frontend Developer", icon: Code, color: "from-amber-500 to-orange-500", shadow: "shadow-amber-500/20" },
  { title: "Backend Developer", icon: Database, color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" },
  { title: "Data Scientist", icon: Briefcase, color: "from-violet-500 to-purple-500", shadow: "shadow-violet-500/20" },
  { title: "UI/UX Designer", icon: Palette, color: "from-rose-500 to-pink-500", shadow: "shadow-rose-500/20" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function RoadmapHome() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [customRole, setCustomRole] = useState("");
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(3);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  const generateRoadmap = async (jobRole: string) => {
    if (!user) return;
    setLoading(jobRole);
    setError("");
    try {
      const headers = await getClientHeaders(getToken, {
        id: user.id,
        name: user.fullName || user.firstName || "User",
        email: user.primaryEmailAddress?.emailAddress || "",
      });
      const res = await fetch(`${API_URL}/api/roadmaps/generate`, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobRole, duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate roadmap");
      
      router.push(`/roadmap/${data.roadmapId}`);
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error("Something went wrong");
      setError(err.message || "Something went wrong. Is the backend running?");
      setLoading(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customRole.trim().length > 0) {
      generateRoadmap(customRole.trim());
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Decorative blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-orange-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-yellow-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
            <Map className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">
            AI Learning{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              Roadmap
            </span>
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            What do you want to learn next? Let AI generate a tailored learning path.
          </p>
        </div>

        {/* Duration Selector */}
        <div className="mb-10 text-center">
          <label className="block text-sm font-semibold text-white/80 mb-3">
            Select Roadmap Duration
          </label>
          <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white/5 p-1.5 border border-white/10 backdrop-blur-sm max-w-md mx-auto">
            {[
              { value: 3, label: "3 Months" },
              { value: 6, label: "6 Months" },
              { value: 9, label: "9 Months" },
              { value: 12, label: "12 Months" },
            ].map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                disabled={loading !== null}
                className={`rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  duration === d.value
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Role Input */}
        <form onSubmit={handleCustomSubmit} className="mb-10 relative">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-muted-foreground/60" />
            <input
              type="text"
              placeholder="e.g., Blockchain Developer, MLOps Engineer..."
              value={customRole}
              onChange={(e) => setCustomRole(e.target.value)}
              disabled={loading !== null}
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-32 text-white placeholder:text-muted-foreground/50 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/50 backdrop-blur-sm disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!customRole.trim() || loading !== null}
              className="absolute right-2 top-2 bottom-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 font-semibold text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading === customRole.trim() ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Generate"}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-white/5"></div>
          <span className="text-sm font-medium text-muted-foreground/60">OR CHOOSE A PATH</span>
          <div className="h-px flex-1 bg-white/5"></div>
        </div>

        {/* Role cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {ROLES.map(({ title, icon: Icon, color, shadow }) => (
            <button
              key={title}
              onClick={() => generateRoadmap(title)}
              disabled={loading !== null}
              className={`group relative flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/8 hover:scale-[1.02] hover:shadow-xl ${shadow} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">{title}</h3>
                <p className="mt-0.5 text-sm text-muted-foreground flex items-center gap-1">
                  <Compass className="h-3 w-3" /> {duration}-month structured plan
                </p>
              </div>
              {loading === title ? (
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
              )}
            </button>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 text-center animate-pulse">
            ⚠️ {error}
          </div>
        )}

        {/* Loading Overlay State */}
        {loading && (
          <div className="mt-10 text-center animate-pulse">
            <p className="text-amber-400 font-medium">✨ Generating your personalized roadmap...</p>
            <p className="text-sm text-muted-foreground mt-1">AI is analyzing the perfect learning path for {loading}</p>
          </div>
        )}
      </div>
    </div>
  );
}
