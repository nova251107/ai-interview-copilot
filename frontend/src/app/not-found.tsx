import Link from "next/link";
import { Brain, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 shadow-xl shadow-violet-500/25">
        <Brain className="h-10 w-10 text-white" />
      </div>

      <p className="text-8xl font-black text-white/10">404</p>
      <h1 className="mt-2 text-3xl font-bold text-white">Page not found</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-8 flex gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-all"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-all"
        >
          <Search className="h-4 w-4" />
          Home Page
        </Link>
      </div>
    </div>
  );
}
