import { UploadForm } from "@/components/upload/upload-form";
import { getPatients } from "@/lib/api";

export default async function UploadPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-heading">Upload Recording</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Upload an EDF file for seizure detection analysis
        </p>
      </div>
      <UploadForm patients={patients} />
    </div>
  );
}
