import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageProps {
  patientId?: number;
}

export default function Page({ patientId }: PageProps) {
  const [, navigate] = useLocation();
  const pageName = window.location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Page';

  return (
    <div className="space-y-6">
      {patientId && (
        <Button
          variant="ghost"
          onClick={() => navigate("/patients")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      <div className="card-base">
        <h1 className="text-3xl font-bold text-foreground mb-4">Vitals</h1>
        {patientId && <p className="text-muted-foreground">Patient ID: {patientId}</p>}
        <p className="text-muted-foreground mt-4">Content will appear here</p>
      </div>
    </div>
  );
}
