import { UploadForm } from "@/components/upload/upload-form";
import { getPatients } from "@/lib/api";

export default async function UploadPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-8 relative">
      <div className="absolute -top-10 -right-10 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <h1 className="text-3xl font-bold text-text-primary font-heading tracking-tight">Upload Recording</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Upload an EDF file for seizure detection analysis
        </p>
      </div>
      
      <div className="relative z-10 bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-8">
          <UploadForm patients={patients} />
        </div>
      </div>
    </div>
  );
}
