import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pill } from "lucide-react";
import { toast } from "sonner";

export default function Prescriptions() {
  const { patientId } = useParams<{ patientId: string }>();
  const pid = parseInt(patientId || "0");
  const [showDialog, setShowDialog] = useState(false);

  const { data: prescriptions = [] } = trpc.prescriptions.getPrescriptions.useQuery({ patientId: pid });
  const createPrescription = trpc.prescriptions.createPrescription.useMutation({
    onSuccess: () => {
      toast.success("Prescription created successfully");
      setShowDialog(false);
      trpc.useUtils().prescriptions.getPrescriptions.invalidate();
    },
    onError: () => toast.error("Failed to create prescription"),
  });

  const deletePrescription = trpc.prescriptions.deletePrescription.useMutation({
    onSuccess: () => {
      toast.success("Prescription deleted");
      trpc.useUtils().prescriptions.getPrescriptions.invalidate();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "filled": return "bg-blue-100 text-blue-800";
      case "expired": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-gray-600 mt-2">Manage patient prescriptions and medication orders</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Active Prescriptions</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Prescription</DialogTitle>
            </DialogHeader>
            <PrescriptionForm
              patientId={pid}
              onSubmit={(data: any) => createPrescription.mutate(data)}
              onSuccess={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No prescriptions yet. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((presc: any) => (
            <Card key={presc.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Pill className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <CardTitle className="text-lg">{presc.medicationName}</CardTitle>
                      <CardDescription>
                        {presc.dosage || "No dosage specified"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(presc.status)}>{presc.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {presc.prescriber && <p className="text-sm"><strong>Prescriber:</strong> {presc.prescriber}</p>}
                {presc.prescriptionDate && (
                  <p className="text-sm"><strong>Prescribed:</strong> {new Date(presc.prescriptionDate).toLocaleDateString()}</p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="destructive" size="sm" onClick={() => deletePrescription.mutate({ id: presc.id })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function PrescriptionForm({ patientId, onSubmit, onSuccess }: any) {
  const [formData, setFormData] = useState({
    patientId,
    medicationName: "",
    dosage: "",
    prescriptionDate: new Date().toISOString().split("T")[0],
    status: "active" as const,
    prescriber: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Medication Name</Label>
        <Input
          value={formData.medicationName}
          onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
          placeholder="e.g., Lisinopril"
        />
      </div>
      <div>
        <Label>Dosage</Label>
        <Input
          value={formData.dosage}
          onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
          placeholder="e.g., 10 mg"
        />
      </div>
      <div>
        <Label>Prescribed Date</Label>
        <Input
          type="date"
          value={formData.prescriptionDate}
          onChange={(e) => setFormData({ ...formData, prescriptionDate: e.target.value })}
        />
      </div>
      <div>
        <Label>Prescriber</Label>
        <Input
          value={formData.prescriber}
          onChange={(e) => setFormData({ ...formData, prescriber: e.target.value })}
          placeholder="Prescriber name"
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="filled">Filled</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() => {
          onSubmit({ ...formData, prescriptionDate: new Date(formData.prescriptionDate) });
          onSuccess();
        }}
        className="w-full"
      >
        Create Prescription
      </Button>
    </div>
  );
}
