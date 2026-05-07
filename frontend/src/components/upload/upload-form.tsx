"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { Card } from "@/components/ui/card";
import type { Patient } from "@/lib/types";

interface UploadFormProps {
  patients: Patient[];
}

export function UploadForm({ patients }: UploadFormProps) {
  const router = useRouter();
  const [selectedPatient, setSelectedPatient] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!selectedPatient) {
      setError("Please select a patient");
      return;
    }
    if (!file) {
      setError("Please select an .edf file");
      return;
    }

    setError("");
    setUploading(true);

    // mock upload delay
    await new Promise((r) => setTimeout(r, 1500));
    router.push(`/recordings/r1`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <Select
          id="patient"
          label="Patient"
          placeholder="Select a patient"
          value={selectedPatient}
          onChange={(e) => setSelectedPatient(e.target.value)}
          options={patients.map((p) => ({
            value: p.id,
            label: `${p.firstName} ${p.lastName} (${p.medicalRecordNumber})`,
          }))}
        />
      </Card>

      <Card>
        <p className="mb-3 text-sm font-medium text-text-secondary font-heading">
          EEG Recording File
        </p>
        <FileDropzone
          accept=".edf"
          onFile={(f) => {
            setFile(f);
            setError("");
          }}
        />
      </Card>

      {error && (
        <p className="rounded-lg bg-rose-accent/10 border border-rose-accent/20 px-4 py-2.5 text-sm text-rose-accent">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button onClick={handleUpload} disabled={uploading} size="lg">
          {uploading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading...
            </span>
          ) : (
            "Upload & Analyze"
          )}
        </Button>
        <Button variant="ghost" onClick={() => router.back()} size="lg">
          Cancel
        </Button>
      </div>
    </div>
  );
}
