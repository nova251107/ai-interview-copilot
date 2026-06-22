"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-red-600/10 blur-3xl" />
      </div>

      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/20">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>

      <h1 className="text-3xl font-bold text-white">Something went wrong</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>

      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <a
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all"
        >
          <Home className="h-4 w-4" />
          Go Home
        </a>
      </div>
    </div>
  );
}
