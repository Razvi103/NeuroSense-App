"use client";

import { useEffect, useRef } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/msal";

export default function LoginPage() {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const redirectTriggered = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
      return;
    }

    if (inProgress === "none" && !redirectTriggered.current) {
      redirectTriggered.current = true;
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthenticated, inProgress, instance, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base">
      <svg className="h-6 w-6 animate-spin text-brand-blue" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}
