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
import { Plus, Trash2, FileCheck } from "lucide-react";
import { toast } from "sonner";

export default function CareGaps() {
  const { patientId } = useParams<{ patientId: string }>();
  const pid = parseInt(patientId || "0");
  const [showDialog, setShowDialog] = useState(false);

  const { data: forms = [] } = trpc.careGaps.getPatientForms.useQuery({ patientId: pid });
  const createForm = trpc.careGaps.createPatientForm.useMutation({
    onSuccess: () => {
      toast.success("Form created successfully");
      setShowDialog(false);
      trpc.useUtils().careGaps.getPatientForms.invalidate();
    },
    onError: () => toast.error("Failed to create form"),
  });

  const deleteForm = trpc.careGaps.deletePatientForm.useMutation({
    onSuccess: () => {
      toast.success("Form deleted");
      trpc.useUtils().careGaps.getPatientForms.invalidate();
    },
  });

  const updateForm = trpc.careGaps.updatePatientForm.useMutation({
    onSuccess: () => {
      toast.success("Form updated");
      trpc.useUtils().careGaps.getPatientForms.invalidate();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Care Gaps & Patient Forms</h1>
        <p className="text-gray-600 mt-2">Track care gaps and manage patient forms and submissions</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Patient Forms</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Patient Form</DialogTitle>
            </DialogHeader>
            <FormDialog
              patientId={pid}
              onSubmit={(data: any) => createForm.mutate(data)}
              onSuccess={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {forms.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No forms yet. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          forms.map((form: any) => (
            <Card key={form.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <FileCheck className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <CardTitle className="text-lg">{form.formName}</CardTitle>
                      <CardDescription>
                        {form.formType || "General Form"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge>Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2 pt-2">
                  <Button variant="destructive" size="sm" onClick={() => deleteForm.mutate({ id: form.id })}>
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

function FormDialog({ patientId, onSubmit, onSuccess }: any) {
  const [formData, setFormData] = useState({
    patientId,
    formName: "",
    formType: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Form Name</Label>
        <Input
          value={formData.formName}
          onChange={(e) => setFormData({ ...formData, formName: e.target.value })}
          placeholder="e.g., Annual Physical Form"
        />
      </div>
      <div>
        <Label>Form Type</Label>
        <Input
          value={formData.formType}
          onChange={(e) => setFormData({ ...formData, formType: e.target.value })}
          placeholder="e.g., Medical History"
        />
      </div>
      <Button
        onClick={() => {
          onSubmit(formData);
          onSuccess();
        }}
        className="w-full"
      >
        Create Form
      </Button>
    </div>
  );
}
