"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Upload, FileText, CheckCircle, XCircle, Loader2,
  ArrowRight, File, Brain, Target, Lightbulb, Star,
  TrendingUp, AlertCircle, RefreshCw, ChevronRight
} from "lucide-react";
import axios from "axios";

type UploadState = "idle" | "dragging" | "uploading" | "success" | "analyzing" | "done" | "error";

interface Analysis {
  atsScore: number;
  summary: string;
  skills: string[];
  strengths: string[];
  suggestions: { category: string; tip: string }[];
  missingKeywords: string[];
  overallFeedback: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ResumePage() {
  const { user } = useUser();
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [progress, setProgress] = useState(0);

  const validateFile = (f: File): string | null => {
    if (f.type !== "application/pdf") return "Only PDF files are allowed!";
    if (f.size > 5 * 1024 * 1024) return "File size must be under 5MB!";
    return null;
  };

  const handleFile = useCallback((f: File) => {
    const error = validateFile(f);
    if (error) { setErrorMessage(error); setUploadState("error"); return; }
    setFile(f); setUploadState("idle"); setErrorMessage("");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
    setUploadState("idle");
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploadState("uploading"); setProgress(0);
    const formData = new FormData();
    formData.append("resume", file);

    try {
      const res = await axios.post(`${API_URL}/api/resume/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-user-id": user.id,
          "x-user-name": user.fullName || user.firstName || "User",
          "x-user-email": user.primaryEmailAddress?.emailAddress || "",
        },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded * 100) / (e.total || 1))),
      });

      const id = res.data.resume.id;
      setUploadState("analyzing");

      // Trigger AI analysis
      await runAnalysis(id);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setErrorMessage(err.response?.data?.message || "Upload failed. Try again.");
      } else {
        setErrorMessage("Upload failed. Try again.");
      }
      setUploadState("error");
    }
  };

  const runAnalysis = async (id: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/resume/analyze/${id}`);
      setAnalysis(res.data.analysis);
      setUploadState("done");
    } catch {
      setUploadState("success"); // fallback: show success without analysis
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-teal-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs Work";
    return "Poor";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">
            Upload Your <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Resume</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Get instant AI-powered ATS score and improvement tips</p>
        </div>

        {/* ── Analyzing State ── */}
        {uploadState === "analyzing" && (
          <div className="rounded-2xl border border-white/5 bg-white/3 p-12 text-center backdrop-blur-sm">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 ring-2 ring-violet-500/30">
              <Brain className="h-10 w-10 text-violet-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white">AI Analyzing Your Resume...</h2>
            <p className="mt-2 text-muted-foreground">Gemini AI is reading your resume and calculating your ATS score</p>
            <div className="mt-6 flex items-center justify-center gap-2">
              {["Extracting text", "Scoring keywords", "Generating tips"].map((step, i) => (
                <span key={step} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin text-violet-400" />
                  {step}
                  {i < 2 && <ChevronRight className="h-3 w-3" />}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── AI Analysis Results ── */}
        {uploadState === "done" && analysis && (
          <div className="space-y-6">
            {/* ATS Score Card */}
            <div className="rounded-2xl border border-white/5 bg-white/3 p-8 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Score Circle */}
                <div className="relative flex-shrink-0">
                  <div className={`flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br ${getScoreBg(analysis.atsScore)} shadow-2xl`}>
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-background">
                      <div className="text-center">
                        <div className={`text-4xl font-black ${getScoreColor(analysis.atsScore)}`}>
                          {analysis.atsScore}
                        </div>
                        <div className="text-xs text-muted-foreground">/ 100</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-400" />
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">ATS Score</span>
                  </div>
                  <h2 className={`text-3xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                    {getScoreLabel(analysis.atsScore)}
                  </h2>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{analysis.summary}</p>
                  <div className="mt-4">
                    <div className="h-2 w-full rounded-full bg-white/5">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${getScoreBg(analysis.atsScore)} transition-all duration-1000`}
                        style={{ width: `${analysis.atsScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills + Strengths */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Skills */}
              <div className="rounded-2xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <h3 className="font-semibold text-white">Skills Detected</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.skills.map((skill) => (
                    <span key={skill} className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div className="rounded-2xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">Your Strengths</h3>
                </div>
                <ul className="space-y-2">
                  {analysis.strengths?.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Suggestions */}
            <div className="rounded-2xl border border-white/5 bg-white/3 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-white">AI Improvement Tips</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {analysis.suggestions?.map((s, i) => (
                  <div key={i} className="flex gap-3 rounded-xl border border-amber-500/10 bg-amber-500/5 p-4">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
                      <span className="text-xs font-bold text-amber-400">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider">{s.category}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{s.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Keywords */}
            {analysis.missingKeywords?.length > 0 && (
              <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-6 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <h3 className="font-semibold text-white">Missing Keywords</h3>
                  <span className="text-xs text-muted-foreground">(Add these to improve ATS score)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingKeywords.map((kw) => (
                    <span key={kw} className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-300">
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Overall Feedback */}
            <div className="rounded-2xl border border-violet-500/10 bg-violet-500/5 p-6 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-5 w-5 text-violet-400" />
                <h3 className="font-semibold text-white">AI Coach Feedback</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{analysis.overallFeedback}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => { setUploadState("idle"); setFile(null); setAnalysis(null); }}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all"
              >
                <RefreshCw className="h-4 w-4" /> Upload New Resume
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:scale-105 transition-all"
              >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Upload Card (idle/error states) ── */}
        {(uploadState === "idle" || uploadState === "dragging" || uploadState === "uploading" || uploadState === "error" || uploadState === "success") && (
          <div className="rounded-2xl border border-white/5 bg-white/3 p-8 backdrop-blur-sm">
            {uploadState === "success" ? (
              <div className="flex flex-col items-center gap-6 py-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-500/30">
                  <CheckCircle className="h-10 w-10 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Upload Successful! 🎉</h2>
                  <p className="mt-2 text-muted-foreground">Your resume has been uploaded and saved.</p>
                </div>
                <button onClick={() => { setUploadState("idle"); setFile(null); }}
                  className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-all">
                  Upload Another
                </button>
              </div>
            ) : (
              <>
                {/* Drop Zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setUploadState("dragging"); }}
                  onDragLeave={() => setUploadState("idle")}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-input")?.click()}
                  className={`relative flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12 transition-all duration-300 ${
                    uploadState === "dragging" ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                    : file ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <input id="file-input" type="file" accept=".pdf" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                  {file ? (
                    <>
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20">
                        <File className="h-8 w-8 text-emerald-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-white">{file.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all ${uploadState === "dragging" ? "bg-blue-500/30 scale-110" : "bg-white/5"}`}>
                        <Upload className={`h-8 w-8 transition-colors ${uploadState === "dragging" ? "text-blue-400" : "text-muted-foreground"}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-semibold text-white">{uploadState === "dragging" ? "Drop it here!" : "Drag & drop your resume"}</p>
                        <p className="text-sm text-muted-foreground mt-1">or <span className="text-blue-400 underline">browse files</span></p>
                        <p className="text-xs text-muted-foreground/60 mt-3">PDF only · Max 5MB</p>
                      </div>
                    </>
                  )}
                </div>

                {uploadState === "error" && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                    <p className="text-sm text-red-400">{errorMessage}</p>
                  </div>
                )}

                {uploadState === "uploading" && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Uploading to Cloudinary...</span>
                      <span className="text-blue-400 font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5">
                      <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <button onClick={handleUpload} disabled={!file || uploadState === "uploading"}
                  className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100">
                  {uploadState === "uploading" ? <><Loader2 className="h-5 w-5 animate-spin" /> Uploading...</> : <><Upload className="h-5 w-5" /> Upload & Analyze Resume</>}
                </button>
              </>
            )}
          </div>
        )}

        {/* Info cards */}
        {(uploadState === "idle" || uploadState === "error") && (
          <div className="mt-6 grid grid-cols-3 gap-4 text-center text-sm text-muted-foreground">
            {[
              { label: "ATS Score", desc: "Instant AI scoring" },
              { label: "Skill Analysis", desc: "Skills gap detection" },
              { label: "AI Tips", desc: "Personalized advice" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-white/3 p-4">
                <p className="font-semibold text-white">{item.label}</p>
                <p className="text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
