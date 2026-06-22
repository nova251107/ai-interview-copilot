"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resume", label: "Resume" },
  { href: "/interview", label: "Interview" },
  { href: "/interview/history", label: "History" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/dsa", label: "DSA Tracker" },
  { href: "/cover-letter", label: "Cover Letter" },
  { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 transition-transform group-hover:scale-110">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              <span className="text-white">AI</span>
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {" "}Copilot
              </span>
            </span>
          </Link>

          {/* Desktop Nav Links (only when signed in) */}
          {isSignedIn && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    pathname === link.href
                      ? "bg-violet-600/20 text-violet-400"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-violet-500/40 hover:scale-105">
                    Get Started
                  </button>
                </SignUpButton>
              </>
            ) : (
              <>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 ring-2 ring-violet-500/30",
                    },
                  }}
                />
                {/* Mobile Menu Button */}
                <button
                  className="md:hidden rounded-lg p-2 text-muted-foreground hover:text-white hover:bg-white/5"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && isSignedIn && (
        <div className="md:hidden border-t border-border/40 bg-background/95 px-4 py-3">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-violet-600/20 text-violet-400"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
