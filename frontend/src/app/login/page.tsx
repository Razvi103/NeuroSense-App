"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EegWaveBg } from "@/components/ui/eeg-wave-bg";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials. Try clinician@neurosense.io / neurosense");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-base">
      <div className="absolute inset-0">
        <EegWaveBg className="absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-base/80 via-base/40 to-base/90" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2.5">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <div className="absolute inset-0 rounded-lg bg-cyan-deep/20 animate-pulse" />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="relative h-6 w-6 text-cyan-accent"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 12h3l2-7 3 14 3-10 2 6h3"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary font-heading">
              NeuroSense
            </h1>
          </div>
          <p className="text-sm text-text-secondary">
            Clinical EEG seizure detection platform
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/20"
        >
          <h2 className="mb-6 text-lg font-semibold text-text-primary font-heading">
            Sign in to your account
          </h2>

          <div className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="clinician@neurosense.io"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-accent/10 border border-rose-accent/20 px-3 py-2 text-xs text-rose-accent">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-6 w-full"
            size="lg"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>

          <p className="mt-5 text-center text-xs text-text-muted">
            Demo: clinician@neurosense.io / neurosense
          </p>
        </form>
      </div>
    </div>
  );
}
