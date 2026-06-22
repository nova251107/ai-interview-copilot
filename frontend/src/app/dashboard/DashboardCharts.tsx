"use client";

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell, PieChart, Pie, Legend,
  Area, AreaChart,
} from "recharts";
import { Code2, Mic, TrendingUp, Target, Award, PieChartIcon } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

type DSAItem = { name: string; solved: number; total: number; fill: string };
type ScoreItem = { date: string; score: number; role: string };
type RoleItem = { role: string; count: number };
type RecentInterview = {
  id: string;
  role: string;
  score: number | null;
  questionCount: number;
  createdAt: string;
};

interface Props {
  dsaChartData: DSAItem[];
  interviewChartData: ScoreItem[];
  dsaTotal: number;
  avgScore: number | null;
  bestScore: number | null;
  worstScore: number | null;
  topRoles: RoleItem[];
  recentInterviews: RecentInterview[];
}

const ROLE_COLORS: Record<string, string> = {
  "Software Engineer": "#6366f1",
  "Data Scientist": "#8b5cf6",
  "Product Manager": "#10b981",
  "UI/UX Designer": "#f43f5e",
};
const FALLBACK_COLORS = ["#6366f1", "#8b5cf6", "#10b981", "#f43f5e", "#f59e0b"];

const CustomDSATooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: DSAItem }> }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="rounded-xl border border-white/10 bg-gray-900 px-4 py-3 shadow-xl text-sm">
        <p className="font-bold text-white">{d.name}</p>
        <p style={{ color: d.fill }}>{d.solved} solved</p>
        <p className="text-muted-foreground">out of {d.total}</p>
      </div>
    );
  }
  return null;
};

const CustomScoreTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: ScoreItem }>; label?: string }) => {
  if (active && payload?.length) {
    const score = payload[0].value;
    const color = score >= 7 ? "#34d399" : score >= 5 ? "#fbbf24" : "#f87171";
    return (
      <div className="rounded-xl border border-white/10 bg-gray-900 px-4 py-3 shadow-xl text-sm">
        <p className="font-bold text-white">{label}</p>
        <p style={{ color }}>Score: {score}/10</p>
        <p className="text-muted-foreground text-xs mt-1">{payload[0].payload.role}</p>
      </div>
    );
  }
  return null;
};

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-muted-foreground/50">—</span>;
  const color = score >= 7 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : score >= 5 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-red-400 bg-red-500/10 border-red-500/20";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {score}/10
    </span>
  );
}

export default function DashboardCharts({
  dsaChartData, interviewChartData, dsaTotal,
  avgScore, bestScore, worstScore, topRoles, recentInterviews,
}: Props) {
  const hasDSA = dsaTotal > 0;
  const hasInterviews = interviewChartData.length > 0;
  const hasRoles = topRoles.length > 0;

  const pieData = topRoles.map((r, i) => ({
    name: r.role,
    value: r.count,
    fill: ROLE_COLORS[r.role] || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <div className="space-y-6 mb-10">

      {/* ── Mini Score Stats Row ── */}
      {(avgScore !== null || bestScore !== null) && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Avg Score", value: avgScore, icon: Target, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20" },
            { label: "Best Score", value: bestScore, icon: Award, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
            { label: "Lowest Score", value: worstScore, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-2xl border ${bg} p-4 flex items-center gap-4 backdrop-blur-sm`}>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value ?? "—"}<span className="text-sm font-normal text-muted-foreground">/10</span></p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts Grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* ── Interview Score Area Chart ── */}
        <div className="rounded-2xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mic className="h-5 w-5 text-violet-400" /> Score Trend
            </h2>
            {hasInterviews && (
              <span className="text-sm font-bold text-violet-400">
                {interviewChartData.length} session{interviewChartData.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {hasInterviews ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={interviewChartData} margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fill: "#9ca3af", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomScoreTooltip />} />
                <Area
                  type="monotone" dataKey="score"
                  stroke="#a78bfa" strokeWidth={2.5}
                  fill="url(#scoreGrad)"
                  dot={{ fill: "#a78bfa", strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: "#7c3aed" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">No interview scores yet</p>
              <a href="/interview" className="mt-3 text-xs text-violet-400 hover:underline">
                Take your first mock interview →
              </a>
            </div>
          )}
        </div>

        {/* ── Role Breakdown Pie Chart ── */}
        <div className="rounded-2xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-pink-400" /> Role Breakdown
            </h2>
          </div>

          {hasRoles ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#e2e8f0" }}
                />
                <Legend
                  iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <PieChartIcon className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">No interviews taken yet</p>
              <a href="/interview" className="mt-3 text-xs text-pink-400 hover:underline">
                Start a mock interview →
              </a>
            </div>
          )}
        </div>

        {/* ── DSA Bar Chart ── */}
        <div className="rounded-2xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Code2 className="h-5 w-5 text-emerald-400" /> DSA Progress
            </h2>
            <span className="text-sm font-bold text-emerald-400">{dsaTotal} solved</span>
          </div>

          {hasDSA ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={dsaChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 13 }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip content={<CustomDSATooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                  <Bar dataKey="solved" radius={[0, 6, 6, 0]} maxBarSize={24}>
                    {dsaChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                {dsaChartData.map((d) => (
                  <div key={d.name} className="text-center">
                    <p className="text-lg font-bold" style={{ color: d.fill }}>{d.solved}</p>
                    <p className="text-xs text-muted-foreground">{d.name}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Code2 className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">No DSA data yet</p>
              <a href="/dsa" className="mt-3 text-xs text-emerald-400 hover:underline">Sync your LeetCode →</a>
            </div>
          )}
        </div>

        {/* ── Recent Interviews Table ── */}
        <div className="rounded-2xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Mic className="h-5 w-5 text-indigo-400" /> Recent Interviews
            </h2>
            <Link href="/interview" className="text-xs text-indigo-400 hover:underline">+ New</Link>
          </div>

          {recentInterviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <Mic className="h-10 w-10 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">No interviews yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentInterviews.map((iv) => (
                <Link
                  key={iv.id}
                  href={`/interview/results/${iv.id}`}
                  className="flex items-center justify-between rounded-xl px-4 py-3 transition-colors hover:bg-white/5 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{iv.role}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(iv.createdAt), "MMM d, yyyy")} · {iv.questionCount}Q
                    </p>
                  </div>
                  <ScoreBadge score={iv.score} />
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
