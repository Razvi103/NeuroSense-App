"use client";

import { useMemo } from "react";
import type { Recording, Patient, SeizureEvent } from "@/lib/types";
import { generateMockEEG, generateConfidenceTimeline } from "@/lib/mock-data";
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
  const eegData = useMemo(() => generateMockEEG(recordingId), [recordingId]);
  const confidenceFrames = useMemo(
    () => generateConfidenceTimeline(recordingId, recording.durationSeconds),
    [recordingId, recording.durationSeconds],
  );

  return (
    <div className="h-[calc(100vh-8rem)] -m-6">
      <EegViewer
        eegData={eegData}
        seizureEvents={seizureEvents}
        confidenceFrames={confidenceFrames}
        recording={recording}
        patient={patient}
      />
    </div>
  );
}
