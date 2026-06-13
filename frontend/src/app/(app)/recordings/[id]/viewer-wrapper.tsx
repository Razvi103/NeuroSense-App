"use client";

import { useEffect, useState } from "react";
import type { Recording, Patient, SeizureEvent, EEGData } from "@/lib/types";
import { getEEGData } from "@/lib/api";
import { EegViewer } from "@/components/eeg/eeg-viewer";

interface ViewerWrapperProps {
  recordingId: string;
  recording: Recording;
  patient: Patient;
  seizureEvents: SeizureEvent[];
}

export function EegViewerWrapper({
  recordingId,
  recording,
  patient,
  seizureEvents,
}: ViewerWrapperProps) {
  const [eegData, setEegData] = useState<EEGData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEegData(null);
    setError(null);

    getEEGData(recordingId)
      .then((data) => {
        if (!cancelled) setEegData(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load EEG data");
      });

    return () => {
      cancelled = true;
    };
  }, [recordingId]);

  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center -m-6">
        <p className="text-text-secondary">Failed to load waveform: {error}</p>
      </div>
    );
  }

  if (!eegData) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center -m-6">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-8 w-8 animate-spin text-text-secondary"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm text-text-secondary">Loading EEG waveform...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] -m-6">
      <EegViewer
        eegData={eegData}
        seizureEvents={seizureEvents}
        recording={recording}
        patient={patient}
      />
    </div>
  );
}
