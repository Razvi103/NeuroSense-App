"use client";

import { useState } from "react";
import Link from "next/link";
import type { Patient } from "@/lib/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, getPatientAge, getInitials } from "@/lib/utils";

interface PatientTableProps {
  patients: Patient[];
}

export function PatientTable({ patients }: PatientTableProps) {
  const [search, setSearch] = useState("");

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.medicalRecordNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search patients by name or MRN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-cyan-deep/40 focus:border-cyan-deep/50 transition-colors"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-3 font-medium text-text-muted font-heading">Patient</th>
              <th className="pb-3 font-medium text-text-muted font-heading">MRN</th>
              <th className="pb-3 font-medium text-text-muted font-heading">Age</th>
              <th className="pb-3 font-medium text-text-muted font-heading">Sex</th>
              <th className="pb-3 font-medium text-text-muted font-heading">Registered</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-border/50 last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={getInitials(p.firstName, p.lastName)} size="sm" />
                    <span className="font-medium text-text-primary">
                      {p.firstName} {p.lastName}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-text-secondary font-mono text-xs">{p.medicalRecordNumber}</td>
                <td className="py-3 text-text-secondary">{getPatientAge(p.dateOfBirth)}</td>
                <td className="py-3 text-text-secondary capitalize">{p.sex}</td>
                <td className="py-3 text-text-secondary">{formatDate(p.createdAt)}</td>
                <td className="py-3 text-right">
                  <Link href={`/patients/${p.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-text-muted">
                  No patients found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
