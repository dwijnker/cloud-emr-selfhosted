import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, FileText, Edit2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function VisitNotes() {
  const [location, navigate] = useLocation();
  const patientId = parseInt(location.split("/")[2]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Queries
  const { data: visits, isLoading, refetch } = trpc.visits.getVisitNotes.useQuery(
    { patientId, limit: 50 },
    { enabled: !!patientId }
  );

  // Mutations
  const createVisitMutation = trpc.visits.createVisitNote.useMutation({
    onSuccess: () => {
      toast.success("Visit note created successfully");
      setShowAddDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteVisitMutation = trpc.visits.deleteVisitNote.useMutation({
    onSuccess: () => {
      toast.success("Visit note deleted");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "signed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const visitData = {
      patientId,
      visitDate: new Date(formData.get("visitDate") as string),
      visitType: (formData.get("visitType") as string) || undefined,
      provider: (formData.get("provider") as string) || undefined,
      chief_complaint: (formData.get("chief_complaint") as string) || undefined,
      history_of_present_illness: (formData.get("history_of_present_illness") as string) || undefined,
      review_of_systems: (formData.get("review_of_systems") as string) || undefined,
      past_medical_history: (formData.get("past_medical_history") as string) || undefined,
      past_surgical_history: (formData.get("past_surgical_history") as string) || undefined,
      medications_review: (formData.get("medications_review") as string) || undefined,
      allergies_review: (formData.get("allergies_review") as string) || undefined,
      physical_exam: (formData.get("physical_exam") as string) || undefined,
      assessment: (formData.get("assessment") as string) || undefined,
      plan: (formData.get("plan") as string) || undefined,
      status: (formData.get("status") as any) || "draft",
    };

    createVisitMutation.mutate(visitData as any);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate("/patients")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Visit Notes</h1>
          <p className="text-gray-600">SOAP-style clinical documentation</p>
        </div>

        {/* Add Visit Button */}
        <div className="mb-8">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Visit Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Visit Note</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                    <Input name="visitDate" type="date" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
                    <Input name="visitType" placeholder="e.g., Office Visit, Telehealth" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <Input name="provider" placeholder="Provider name" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
                  <Textarea name="chief_complaint" placeholder="Chief complaint" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">History of Present Illness</label>
                  <Textarea name="history_of_present_illness" placeholder="HPI" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Review of Systems</label>
                  <Textarea name="review_of_systems" placeholder="ROS" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Past Medical History</label>
                    <Textarea name="past_medical_history" placeholder="PMH" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Past Surgical History</label>
                    <Textarea name="past_surgical_history" placeholder="PSH" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medications Review</label>
                    <Textarea name="medications_review" placeholder="Current medications" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies Review</label>
                    <Textarea name="allergies_review" placeholder="Known allergies" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Exam</label>
                  <Textarea name="physical_exam" placeholder="Physical examination findings" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
                    <Textarea name="assessment" placeholder="Clinical assessment" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                    <Textarea name="plan" placeholder="Treatment plan" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select name="status" defaultValue="draft">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="signed">Signed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full">
                  Create Visit Note
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Visit Notes List */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Visit History</h2>
          {isLoading ? (
            <div className="text-center py-12">Loading visit notes...</div>
          ) : visits && visits.length > 0 ? (
            <div className="grid gap-4">
              {visits
                .sort((a: any, b: any) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
                .map((visit: any) => (
                  <Card key={visit.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-5 h-5 text-purple-500" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {new Date(visit.visitDate).toLocaleDateString()}
                          </h3>
                          <Badge className={getStatusColor(visit.status ?? "draft")}>
                            {visit.status ?? "draft"}
                          </Badge>
                          {visit.visitType && <Badge variant="outline">{visit.visitType}</Badge>}
                        </div>
                        {visit.provider && <p className="text-sm text-gray-600">Provider: {visit.provider}</p>}
                        {visit.chief_complaint && (
                          <p className="text-sm text-gray-700 mt-2">
                            <span className="font-medium">CC:</span> {visit.chief_complaint.substring(0, 100)}...
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVisitMutation.mutate({ id: visit.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No visit notes recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
