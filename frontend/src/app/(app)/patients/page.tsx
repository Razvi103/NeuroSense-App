import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientTable } from "@/components/patients/patient-table";
import { getPatients } from "@/lib/api";

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-6 relative">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex items-center justify-between relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-text-primary font-heading tracking-tight">Patients</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {patients.length} registered patients
          </p>
        </div>
        <Link href="/patients/new">
          <Button size="sm">
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Register Patient
          </Button>
        </Link>
      </div>
      <Card className="relative z-10 overflow-hidden pt-0 px-0 pb-0">
        <div className="p-5 border-b border-border bg-brand-blue-surface/50">
          <h2 className="text-lg font-semibold text-brand-blue-dark font-heading">
            Patient Directory
          </h2>
        </div>
        <div className="p-5">
          <PatientTable patients={patients} />
        </div>
      </Card>
    </div>
  );
}
