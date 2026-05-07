import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStats, getRecordings, getPatients } from "@/lib/api";
import { formatDate, formatDuration } from "@/lib/utils";
import type { RecordingStatus } from "@/lib/types";

const statusVariant: Record<RecordingStatus, "success" | "warning" | "danger" | "info"> = {
  analyzed: "success",
  pending: "default" as "info",
  analyzing: "info",
  flagged: "danger",
};

export default async function DashboardPage() {
  const [stats, recordings, patients] = await Promise.all([
    getStats(),
    getRecordings(),
    getPatients(),
  ]);

  const recentRecordings = [...recordings]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5);

  const statCards = [
    { label: "Total Patients", value: stats.totalPatients, color: "text-cyan-accent" },
    { label: "Recordings", value: stats.totalRecordings, color: "text-text-primary" },
    { label: "Seizures Detected", value: stats.totalSeizures, color: "text-amber-accent" },
    { label: "Pending Review", value: stats.pendingReviews, color: "text-rose-accent" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Overview of patient recordings and analysis results
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/patients/new">
            <Button variant="secondary" size="sm">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
              New Patient
            </Button>
          </Link>
          <Link href="/upload">
            <Button size="sm">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload EEG
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} hover>
            <p className="text-xs font-medium text-text-muted uppercase tracking-wider font-heading">
              {stat.label}
            </p>
            <p className={`mt-2 text-3xl font-bold font-heading ${stat.color}`}>
              {stat.value}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary font-heading">
            Recent Recordings
          </h2>
          <Link href="/patients" className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-heading">
            View all patients
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-text-muted font-heading">Patient</th>
                <th className="pb-3 font-medium text-text-muted font-heading">File</th>
                <th className="pb-3 font-medium text-text-muted font-heading">Date</th>
                <th className="pb-3 font-medium text-text-muted font-heading">Duration</th>
                <th className="pb-3 font-medium text-text-muted font-heading">Seizures</th>
                <th className="pb-3 font-medium text-text-muted font-heading">Status</th>
                <th className="pb-3" />
              </tr>
            </thead>
            <tbody>
              {recentRecordings.map((rec) => {
                const patient = patients.find((p) => p.id === rec.patientId);
                return (
                  <tr key={rec.id} className="border-b border-border/50 last:border-0 hover:bg-elevated/50 transition-colors">
                    <td className="py-3 text-text-primary font-medium">
                      {patient ? `${patient.firstName} ${patient.lastName}` : "Unknown"}
                    </td>
                    <td className="py-3 text-text-secondary font-mono text-xs">
                      {rec.fileName}
                    </td>
                    <td className="py-3 text-text-secondary">
                      {formatDate(rec.uploadedAt)}
                    </td>
                    <td className="py-3 text-text-secondary">
                      {formatDuration(rec.durationSeconds)}
                    </td>
                    <td className="py-3">
                      {rec.seizureCount > 0 ? (
                        <span className="text-amber-accent font-semibold">{rec.seizureCount}</span>
                      ) : (
                        <span className="text-text-muted">--</span>
                      )}
                    </td>
                    <td className="py-3">
                      <Badge variant={statusVariant[rec.status]}>{rec.status}</Badge>
                    </td>
                    <td className="py-3 text-right">
                      {(rec.status === "analyzed" || rec.status === "flagged") && (
                        <Link href={`/recordings/${rec.id}`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 hover:underline">View</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
