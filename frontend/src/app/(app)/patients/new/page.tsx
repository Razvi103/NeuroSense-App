import { Card } from "@/components/ui/card";
import { PatientForm } from "@/components/patients/patient-form";

export default function NewPatientPage() {
  return (
    <div className="space-y-8 relative">
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-text-primary font-heading tracking-tight">Register Patient</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add a new patient to the system
        </p>
      </div>
      
      <div className="relative z-10 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="h-2 w-full bg-gradient-to-r from-brand-blue to-brand-teal" />
        <div className="p-6">
          <PatientForm />
        </div>
      </div>
    </div>
  );
}
