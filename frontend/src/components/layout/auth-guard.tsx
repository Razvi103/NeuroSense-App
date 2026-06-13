"use client";

import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();

  useEffect(() => {
    if (inProgress === "none" && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, inProgress, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <svg className="h-8 w-8 animate-spin text-brand-blue" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return <>{children}</>;
}
