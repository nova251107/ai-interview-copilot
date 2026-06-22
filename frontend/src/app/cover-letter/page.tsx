"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import toast, { Toaster } from "react-hot-toast";
import {
  Loader2, Mail, Sparkles, Copy, Download,
  FileText, Building2, Briefcase, CheckCircle2, ChevronRight, Check, Printer
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function CoverLetterPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [usedResume, setUsedResume] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  const handleGenerate = async () => {
    if (!user || !jobDescription.trim()) return;
    setLoading(true);
    setCoverLetter("");

    try {
      const res = await fetch(`${API_URL}/api/cover-letter/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-name": user.fullName || user.firstName || "Applicant",
          "x-user-email": user.primaryEmailAddress?.emailAddress || "",
        },
        body: JSON.stringify({
          jobDescription: jobDescription.trim(),
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Generation failed");

      setCoverLetter(data.coverLetter);
      setUsedResume(data.usedResume);
      toast.success(data.usedResume
        ? "✨ Generated using your resume!"
        : "✨ Generated! Upload a resume for personalized results.");
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error("Something went wrong");
      toast.error(err.message || "Something went wrong. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coverLetter);
      setCopied(true);
      toast.success("📋 Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy. Please select and copy manually.");
    }
  };

  const handleDownloadPDF = () => {
    // Build a minimal print-only HTML document and open it in a new window
    const company = companyName || "Company";
    const role = jobTitle || "Role";
    const title = `Cover Letter — ${role} at ${company}`;

    const printContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      color: #111;
      background: #fff;
      padding: 2.5cm 3cm;
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 24px;
      padding-bottom: 8px;
      border-bottom: 2px solid #333;
      letter-spacing: 0.03em;
    }
    pre {
      font-family: Georgia, "Times New Roman", serif;
      font-size: 12pt;
      line-height: 1.8;
      white-space: pre-wrap;
      word-break: break-word;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 2.5cm 3cm; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <pre>${coverLetter.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) {
      toast.error("Popup blocked! Please allow popups and try again.");
      return;
    }
    printWindow.document.write(printContent);
    printWindow.document.close();
    toast.success("🖨️ Print dialog opened — choose 'Save as PDF'!");
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([coverLetter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const company = companyName || "Company";
    const role = jobTitle || "Role";
    a.href = url;
    a.download = `Cover_Letter_${role}_${company}.txt`.replace(/\s+/g, "_");
    a.click();
    URL.revokeObjectURL(url);
    toast.success("⬇️ Downloaded as .txt!");
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
      </div>
    );
  }

  const charCount = jobDescription.length;
  const isReady = jobDescription.trim().length > 50;

  // Word count for the generated cover letter
  const wordCount = coverLetter.trim()
    ? coverLetter.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <div className="relative min-h-screen bg-background overflow-hidden pb-20">
      <Toaster position="top-right" toastOptions={{
        style: { background: "#1e1e2e", color: "#fff", border: "1px solid rgba(255,255,255,0.1)" }
      }} />

      {/* Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-48 -right-48 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6">

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
            AI Cover Letter{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Generator
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Paste a job description — AI writes a tailored cover letter using your resume in seconds.
          </p>

          {/* Resume indicator */}
          {usedResume && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Generated using your resume
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* LEFT — Input Panel */}
          <div className="flex flex-col gap-4">

            {/* Optional fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Job Title (optional)"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground/40 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground/50" />
                <input
                  type="text"
                  placeholder="Company Name (optional)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-9 pr-4 text-sm text-white placeholder:text-muted-foreground/40 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                />
              </div>
            </div>

            {/* JD Textarea */}
            <div className="relative flex-1">
              <textarea
                placeholder={`Paste the full Job Description here...\n\nExample:\nWe are looking for a Backend Engineer with 2+ years of Node.js experience, proficient in REST APIs, PostgreSQL, and cloud services...`}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={16}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white placeholder:text-muted-foreground/30 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none leading-relaxed"
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground/40">
                {charCount} chars
              </div>
            </div>

            {/* Tip */}
            {!isReady && (
              <p className="text-xs text-muted-foreground/50 text-center">
                💡 Paste at least 50 characters of the job description to generate
              </p>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={loading || !isReady}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 py-4 font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating your cover letter...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Cover Letter
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>

            {/* Resume notice */}
            <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-white/3 p-3">
              <FileText className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                <span className="text-white font-medium">Pro tip:</span> Upload your resume at{" "}
                <a href="/resume" className="text-blue-400 hover:underline">/resume</a>{" "}
                for a fully personalized letter that references your actual skills and experience.
              </p>
            </div>
          </div>

          {/* RIGHT — Output Panel */}
          <div className="flex flex-col">
            <div className={`flex-1 rounded-2xl border transition-all duration-500 ${
              coverLetter
                ? "border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/5"
                : "border-white/5 bg-white/3"
            } backdrop-blur-sm`}>

              {coverLetter ? (
                <div className="flex flex-col h-full">
                  {/* Output Header */}
                  <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-semibold text-white">Your Cover Letter</span>
                    </div>
                    <div className="flex gap-2">
                      {/* Copy Button */}
                      <button
                        onClick={handleCopy}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                          copied
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                            : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                        }`}
                      >
                        {copied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copy
                          </>
                        )}
                      </button>

                      {/* Download PDF Button */}
                      <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/20"
                        title="Opens print dialog — choose 'Save as PDF'"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        PDF
                      </button>

                      {/* Download .txt Button */}
                      <button
                        onClick={handleDownloadTxt}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-white/10"
                        title="Download as plain text"
                      >
                        <Download className="h-3.5 w-3.5" />
                        .txt
                      </button>
                    </div>
                  </div>

                  {/* Word Count Badge */}
                  <div className="flex items-center gap-2 px-6 pt-3 pb-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-0.5 text-xs font-medium text-blue-300">
                      <FileText className="h-3 w-3" />
                      {wordCount} {wordCount === 1 ? "word" : "words"}
                    </span>
                  </div>

                  {/* Letter Content */}
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-8 text-white/90">
                      {coverLetter}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-8">
                  {loading ? (
                    <>
                      <div className="relative mb-6">
                        <div className="h-16 w-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <Mail className="absolute inset-0 m-auto h-7 w-7 text-blue-400" />
                      </div>
                      <p className="text-white font-semibold mb-1">Writing your cover letter...</p>
                      <p className="text-muted-foreground text-sm">AI is crafting a personalized letter just for you</p>
                    </>
                  ) : (
                    <>
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                        <Mail className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                      <p className="text-white font-semibold mb-2">Your cover letter will appear here</p>
                      <p className="text-muted-foreground text-sm">
                        Paste a job description on the left and click Generate
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
