import { notFound } from "next/navigation";
import { getRecording, getPatient, getSeizureEvents } from "@/lib/api";
import { EegViewerWrapper } from "./viewer-wrapper";

export default async function RecordingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recording = await getRecording(id);
  if (!recording) notFound();

  const [patient, seizureEvents] = await Promise.all([
    getPatient(recording.patientId),
    getSeizureEvents(id),
  ]);

  if (!patient) notFound();

  return (
    <EegViewerWrapper
      recordingId={id}
      recording={recording}
      patient={patient}
      seizureEvents={seizureEvents}
    />
  );
}
