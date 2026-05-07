import { Card } from "@/components/ui/card";
import { PatientForm } from "@/components/patients/patient-form";

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Register Patient</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Add a new patient to the system
        </p>
      </div>
      <Card>
        <PatientForm />
      </Card>
    </div>
  );
}
