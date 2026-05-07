import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientTable } from "@/components/patients/patient-table";
import { getPatients } from "@/lib/api";

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">Patients</h1>
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
      <Card>
        <PatientTable patients={patients} />
      </Card>
    </div>
  );
}
