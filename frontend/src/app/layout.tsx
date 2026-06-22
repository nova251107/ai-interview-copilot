import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Navbar from "@/components/Navbar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "AI Interview Copilot | Ace Your Next Interview",
    template: "%s | AI Interview Copilot",
  },
  description:
    "AI-powered platform to analyze your resume, practice mock interviews with instant feedback, generate cover letters, and follow a personalized learning roadmap. Free to use.",
  keywords: [
    "AI interview", "mock interview", "resume analyzer", "ATS score",
    "cover letter generator", "learning roadmap", "DSA tracker",
    "interview preparation", "AI feedback", "job interview practice",
  ],
  authors: [{ name: "AI Interview Copilot" }],
  creator: "AI Interview Copilot",
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "AI Interview Copilot | Ace Your Next Interview",
    description:
      "Practice mock interviews, analyze your resume, generate cover letters, and follow an AI roadmap — all free.",
    siteName: "AI Interview Copilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Interview Copilot",
    description: "AI-powered interview preparation platform — free to use.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{ elements: { card: "bg-background" }, baseTheme: dark } as Record<string, unknown>}>
      <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
        <body className="min-h-screen bg-background text-foreground antialiased">
          <Navbar />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
