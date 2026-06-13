"use client";

import { MsalProvider } from "@azure/msal-react";
import { msalInstance } from "@/lib/msal";
import { useEffect, useState } from "react";

export function MsalProviderWrapper({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    msalInstance.initialize().then(() => {
      msalInstance.handleRedirectPromise().then((response) => {
        if (response?.account) {
          msalInstance.setActiveAccount(response.account);
        }
        setInitialized(true);
      });
    });
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base text-text-primary">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-6 w-6 animate-spin text-brand-blue" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium font-heading">Initializing Identity...</p>
        </div>
      </div>
    );
  }

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
