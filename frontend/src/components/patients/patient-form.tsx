"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function PatientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    // mock -- in production this would POST to the backend
    await new Promise((r) => setTimeout(r, 800));
    router.push("/patients");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <Input id="firstName" label="First name" placeholder="Maria" required />
        <Input id="lastName" label="Last name" placeholder="Ionescu" required />
      </div>
      <Input id="dob" label="Date of birth" type="date" required />
      <Select
        id="sex"
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
      <Input id="mrn" label="Medical record number" placeholder="MRN-2024-XXXX" required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-text-secondary font-heading">
          Clinical notes
        </label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Relevant clinical history..."
          className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-colors resize-none shadow-sm"
        />
      </div>
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
