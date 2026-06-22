import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  FileText, Mic, Map, Code2, Clock,
  Star, Zap, ChevronRight, Trophy, Activity, Mail,
  TrendingUp, Target,
} from "lucide-react";
import { format } from "date-fns";
import DashboardCharts from "./DashboardCharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const quickActions = [
  { label: "Analyze Resume",    icon: FileText, href: "/resume",       desc: "Upload & get AI feedback",    color: "hover:border-blue-500/30 hover:bg-blue-600/5",    iconColor: "text-blue-400" },
  { label: "Start Interview",   icon: Mic,      href: "/interview",    desc: "Practice with AI",            color: "hover:border-violet-500/30 hover:bg-violet-600/5", iconColor: "text-violet-400" },
  { label: "Cover Letter",      icon: Mail,     href: "/cover-letter", desc: "AI-tailored in seconds",     color: "hover:border-cyan-500/30 hover:bg-cyan-600/5",    iconColor: "text-cyan-400" },
  { label: "View Roadmap",      icon: Map,      href: "/roadmap",      desc: "Your learning path",          color: "hover:border-amber-500/30 hover:bg-amber-600/5",  iconColor: "text-amber-400" },
  { label: "DSA Tracker",       icon: Code2,    href: "/dsa",          desc: "Sync LeetCode progress",     color: "hover:border-emerald-500/30 hover:bg-emerald-600/5", iconColor: "text-emerald-400" },
];

interface DBInterview {
  id: string;
  createdAt: string;
  score: number | null;
  role: string;
}

interface DBRoadmap {
  id: string;
  createdAt: string;
  role: string;
}

interface DBResume {
  id: string;
  createdAt: string;
  atsScore: number | null;
}

interface UserStats {
  totalInterviews: number;
  avgScore: number | null;
  bestScore: number | null;
  worstScore: number | null;
  scoreHistory: Array<{ date: string; score: number; role: string }>;
  topRoles: Array<{ role: string; count: number }>;
  recentInterviews: Array<{
    id: string;
    role: string;
    score: number | null;
    questionCount: number;
    createdAt: string;
  }>;
}

async function fetchSafe(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return data.success ? data : null;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName || "Developer";
  const avatarUrl = user.imageUrl;
  const email = user.emailAddresses[0]?.emailAddress;
  const userId = user.id;

  // Fetch all data in parallel
  const [userData, dsaData, roadmapsData, interviewsData, statsData] = await Promise.all([
    fetchSafe(`${API}/api/users/${userId}`),
    fetchSafe(`${API}/api/dsa/user/${userId}`),
    fetchSafe(`${API}/api/roadmaps/user/${userId}`),
    fetchSafe(`${API}/api/interviews/user/${userId}/all`),
    fetchSafe(`${API}/api/users/${userId}/stats`),
  ]);

  // ── Compute stats ────────────────────────────────────────────
  const interviews: DBInterview[] = interviewsData?.interviews || [];
  const roadmaps: DBRoadmap[] = roadmapsData?.roadmaps || [];
  const dsa = dsaData?.dsa || { easy: 0, medium: 0, hard: 0 };
  const resumes: DBResume[] = userData?.user?.resumes || [];
  const userStats: UserStats | null = statsData?.stats || null;

  const interviewCount = interviews.length;
  const dsaTotal = (dsa.easy || 0) + (dsa.medium || 0) + (dsa.hard || 0);
  const roadmapCount = roadmaps.length;
  const latestATS = resumes.length > 0 ? (resumes[0].atsScore ?? "—") : "—";

  // ── Chart data ───────────────────────────────────────────────
  const dsaChartData = [
    { name: "Easy",   solved: dsa.easy   || 0, total: 951,  fill: "#34d399" },
    { name: "Medium", solved: dsa.medium || 0, total: 2074, fill: "#fbbf24" },
    { name: "Hard",   solved: dsa.hard   || 0, total: 947,  fill: "#f87171" },
  ];

  const scoreHistory = userStats?.scoreHistory || [];
  const interviewChartData = (
    scoreHistory.length > 0
      ? scoreHistory
      : interviews
          .filter((iv) => iv.score !== null)
          .slice(-7)
          .map((iv) => ({ date: iv.createdAt, score: iv.score as number, role: iv.role }))
  ).map((iv) => ({
    date: format(new Date(iv.date || ""), "MMM d"),
    score: iv.score,
    role: iv.role,
  }));

  // ── Activity feed ────────────────────────────────────────────
  type ActivityItem = { icon: string; text: string; sub: string; ts: Date };
  const activityItems: ActivityItem[] = [];

  interviews.slice(0, 3).forEach((iv: DBInterview) => {
    activityItems.push({
      icon: "🎤",
      text: `Mock Interview — ${iv.role}`,
      sub: iv.score != null ? `Score: ${iv.score}/10` : "In progress",
      ts: new Date(iv.createdAt),
    });
  });

  roadmaps.slice(0, 2).forEach((rm: DBRoadmap) => {
    activityItems.push({
      icon: "🗺️",
      text: `Roadmap Generated — ${rm.role}`,
      sub: "Learning plan created",
      ts: new Date(rm.createdAt),
    });
  });

  resumes.slice(0, 2).forEach((r: DBResume) => {
    activityItems.push({
      icon: "📄",
      text: "Resume Analyzed",
      sub: r.atsScore ? `ATS Score: ${r.atsScore}%` : "Analyzed",
      ts: new Date(r.createdAt),
    });
  });

  if (dsa.easy + dsa.medium + dsa.hard > 0) {
    activityItems.push({
      icon: "💻",
      text: "DSA Progress Synced",
      sub: `${dsaTotal} problems solved`,
      ts: new Date(dsa.updatedAt || 0),
    });
  }

  activityItems.sort((a, b) => b.ts.getTime() - a.ts.getTime());

  const stats = [
    { label: "Interviews Taken",  value: interviewCount.toString(), icon: Mic,     color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", border: "border-violet-500/20" },
    { label: "Avg Interview Score", value: userStats?.avgScore != null ? `${userStats.avgScore}/10` : "—", icon: Target,  color: "from-indigo-500 to-blue-600",   bg: "bg-indigo-500/10",  border: "border-indigo-500/20" },
    { label: "DSA Solved",         value: dsaTotal.toString(),       icon: Code2,   color: "from-emerald-500 to-teal-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    { label: "Roadmaps Created",   value: roadmapCount.toString(),   icon: Map,     color: "from-orange-500 to-amber-600", bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt={firstName}
              className="h-16 w-16 rounded-2xl ring-2 ring-violet-500/30 shadow-xl object-cover" />
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back,{" "}
                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                  {firstName}!
                </span>
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" /> {email}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-400">
            <Activity className="h-4 w-4" /> Live Dashboard
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}
              className={`group relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Charts Section (Client Component) ── */}
        <DashboardCharts
          dsaChartData={dsaChartData}
          interviewChartData={interviewChartData}
          dsaTotal={dsaTotal}
          avgScore={userStats?.avgScore ?? null}
          bestScore={userStats?.bestScore ?? null}
          worstScore={userStats?.worstScore ?? null}
          topRoles={userStats?.topRoles || []}
          recentInterviews={userStats?.recentInterviews || []}
        />

        {/* ── Quick Actions ── */}
        <div className="mb-10">
          <h2 className="mb-4 text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-400" /> Quick Actions
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <a key={action.label} href={action.href}
                className={`group flex items-center gap-4 rounded-2xl border border-white/5 bg-white/3 p-5 backdrop-blur-sm transition-all duration-300 ${action.color} hover:-translate-y-1 hover:border-opacity-100`}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 transition-transform group-hover:scale-110">
                  <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 transition-transform group-hover:translate-x-1" />
              </a>
            ))}
          </div>
        </div>

        {/* ── Activity Feed ── */}
        <div className="rounded-2xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-semibold text-white flex items-center gap-2">
            <Star className="h-5 w-5 text-violet-400" /> Recent Activity
          </h2>

          {activityItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-medium">No activity yet.</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Start by uploading your resume or taking a mock interview!
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {activityItems.slice(0, 8).map((item, i) => (
                <div key={i}
                  className="group flex items-center gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-white/5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-lg">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{item.text}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground/50">
                    {format(item.ts, "MMM d, HH:mm")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
