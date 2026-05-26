import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientDetail({ patientId }: { patientId: number }) {
  const [, navigate] = useLocation();

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/patients")}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Patients
      </Button>

      <div className="card-base">
        <h1 className="text-3xl font-bold text-foreground mb-4">Patient Detail</h1>
        <p className="text-muted-foreground">Patient ID: {patientId}</p>
        <p className="text-muted-foreground mt-4">Patient details will appear here</p>
      </div>
    </div>
  );
}
