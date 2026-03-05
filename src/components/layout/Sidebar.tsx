"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserProfile } from "@/types/projects";

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard",             href: "/dashboard",             icon: IconGrid },
  { label: "SOPs",                  href: "/sops",                  icon: IconDocument },
  { label: "OKRs",                  href: "/okrs",                  icon: IconTarget },
  { label: "Internal Projects",     href: "/internal-projects",     icon: IconFolder },
  { label: "Recommended Projects",  href: "/recommended-projects",  icon: IconStar },
  { label: "Projects",              href: "/projects",              icon: IconBriefcase },
  { label: "Docs",                  href: "/docs",                  icon: IconBook },
  { label: "Talent Pool",           href: "/talent-pool",           icon: IconUsers },
  { label: "Leads",                 href: "/leads",                 icon: IconChart },
  { label: "Users",                 href: "/users",                 icon: IconPerson },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({ profile }: { profile: UserProfile | null }) {
  const pathname = usePathname();

  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || "User";
  const userRole = profile?.type
    ? profile.type.charAt(0).toUpperCase() + profile.type.slice(1)
    : "";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      {/* ── Logo ──────────────────────────────────────────────────── */}
      <div className="px-4 py-5 flex items-center gap-2.5 shrink-0">
        <div className="w-6 h-6 rounded bg-accent flex items-center justify-center text-white text-xs font-bold select-none leading-none">
          b
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-tight">
          Blur Studio
        </span>
      </div>

      {/* ── Navigation ────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            pathname === href ||
            (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm mb-0.5 transition-colors",
                isActive
                  ? "bg-accent text-white"
                  : "text-text-secondary hover:text-text-primary hover:bg-muted",
              ].join(" ")}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── User ──────────────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-border flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-text-muted text-xs font-semibold">
          {profile?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.picture}
              alt={userName}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-text-primary truncate leading-tight">
            {userName}
          </p>
          <p className="text-xs text-text-muted truncate capitalize leading-tight">
            {userRole}
          </p>
        </div>
      </div>
    </aside>
  );
}

// ── Icons (inline SVG) ────────────────────────────────────────────────────────

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconDocument({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function IconTarget({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function IconFolder({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function IconBriefcase({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconBook({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function IconPerson({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
