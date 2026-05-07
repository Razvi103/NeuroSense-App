"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createPatient } from "@/lib/api";
import type { PatientSex } from "@/lib/types";

export function PatientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      await createPatient({
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        dateOfBirth: formData.get("dob") as string,
        sex: formData.get("sex") as PatientSex,
        medicalRecordNumber: formData.get("mrn") as string,
        notes: formData.get("notes") as string || undefined,
      });
      
      router.push("/patients");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to register patient");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <Input id="firstName" name="firstName" label="First name" placeholder="Maria" required />
        <Input id="lastName" name="lastName" label="Last name" placeholder="Ionescu" required />
      </div>
      <Input id="dob" name="dob" label="Date of birth" type="date" required />
      <Select
        id="sex"
        name="sex"
        label="Sex"
        placeholder="Select sex"
        defaultValue=""
        options={[
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
          { value: "other", label: "Other" },
        ]}
        required
      />
      <Input id="mrn" name="mrn" label="Medical record number" placeholder="MRN-2024-XXXX" required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-text-secondary font-heading">
          Clinical notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Relevant clinical history..."
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-colors resize-none shadow-sm"
        />
      </div>
      
      {error && (
        <p className="text-sm text-rose-accent bg-rose-accent/10 px-3 py-2 rounded-md border border-rose-accent/20">
          {error}
        </p>
      )}
      
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register Patient"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
