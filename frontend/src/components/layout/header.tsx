"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const userName = session?.user?.name ?? "User";
  const nameParts = userName.split(" ");
  const initials = nameParts.length >= 2
    ? getInitials(nameParts[0], nameParts[nameParts.length - 1])
    : userName.slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-surface/80 backdrop-blur-xl px-6">
      <div />
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-elevated cursor-pointer"
        >
          <span className="text-sm text-text-secondary font-heading hidden sm:block">
            {userName}
          </span>
          <Avatar initials={initials} size="sm" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-surface p-1.5 shadow-md">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-sm font-medium text-text-primary font-heading">{userName}</p>
              <p className="text-xs text-text-muted">{session?.user?.email}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
