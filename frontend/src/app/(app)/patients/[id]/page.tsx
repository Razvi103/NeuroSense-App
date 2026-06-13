import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { getPatient, getRecordingsForPatient } from "@/lib/api";
import { formatDate, formatDuration, getPatientAge, getInitials } from "@/lib/utils";
import type { RecordingStatus } from "@/lib/types";

const statusVariant: Record<RecordingStatus, "success" | "warning" | "danger" | "info"> = {
  analyzed: "success",
  no_seizures: "success",
  pending: "info",
  analyzing: "info",
  flagged: "danger",
};

const statusLabel: Record<RecordingStatus, string> = {
  analyzed: "analyzed",
  no_seizures: "no seizures",
  pending: "pending",
  analyzing: "analyzing",
  flagged: "flagged",
};

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [patient, recordings] = await Promise.all([
    getPatient(id),
    getRecordingsForPatient(id),
  ]);

  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar initials={getInitials(patient.firstName, patient.lastName)} size="lg" />
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-sm text-text-secondary">
            {patient.medicalRecordNumber} &middot; {getPatientAge(patient.dateOfBirth)} years &middot;{" "}
            <span className="capitalize">{patient.sex}</span>
          </p>
        </div>
      </div>

      {patient.notes && (
        <Card>
          <CardTitle>Clinical Notes</CardTitle>
          <p className="mt-2 text-sm text-text-secondary leading-relaxed">
            {patient.notes}
          </p>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Recordings ({recordings.length})</CardTitle>
          <Link href="/upload">
            <Button size="sm">Upload Recording</Button>
          </Link>
        </div>

        {recordings.length === 0 ? (
          <p className="py-8 text-center text-text-muted text-sm">
            No recordings yet. Upload an EEG to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-text-muted font-heading">File</th>
                  <th className="pb-3 font-medium text-text-muted font-heading">Date</th>
                  <th className="pb-3 font-medium text-text-muted font-heading">Duration</th>
                  <th className="pb-3 font-medium text-text-muted font-heading">Channels</th>
                  <th className="pb-3 font-medium text-text-muted font-heading">Seizures</th>
                  <th className="pb-3 font-medium text-text-muted font-heading">Status</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {recordings.map((rec) => (
                  <tr key={rec.id} className="border-b border-border/50 last:border-0 hover:bg-elevated/50 transition-colors">
                    <td className="py-3 text-text-primary font-mono text-xs">{rec.fileName}</td>
                    <td className="py-3 text-text-secondary">{formatDate(rec.uploadedAt)}</td>
                    <td className="py-3 text-text-secondary">{formatDuration(rec.durationSeconds)}</td>
                    <td className="py-3 text-text-secondary">{rec.channelCount}ch</td>
                    <td className="py-3">
                      {rec.seizureCount > 0 ? (
                        <span className="text-amber-accent font-semibold">{rec.seizureCount}</span>
                      ) : (
                        <span className="text-text-muted">--</span>
                      )}
                    </td>
                    <td className="py-3">
                      <Badge variant={statusVariant[rec.status]}>{statusLabel[rec.status]}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      {(rec.status === "analyzed" || rec.status === "no_seizures" || rec.status === "flagged") && (
                        <Link href={`/recordings/${rec.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 hover:underline">View EEG</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
