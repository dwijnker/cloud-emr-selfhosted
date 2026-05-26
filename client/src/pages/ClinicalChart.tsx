import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Plus, Trash2, Edit2, CheckCircle, AlertTriangle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ClinicalChart() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const patientId = parseInt(location.split("/")[2]);

  const [activeTab, setActiveTab] = useState("problems");
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Queries
  const { data: problems, isLoading: problemsLoading, refetch: refetchProblems } = trpc.clinical.getProblems.useQuery(
    { patientId },
    { enabled: !!patientId }
  );
  const { data: allergies, isLoading: allergiesLoading, refetch: refetchAllergies } = trpc.clinical.getAllergies.useQuery(
    { patientId },
    { enabled: !!patientId }
  );
  const { data: medications, isLoading: medicationsLoading, refetch: refetchMedications } = trpc.clinical.getMedications.useQuery(
    { patientId },
    { enabled: !!patientId }
  );
  const { data: immunizations, isLoading: immunizationsLoading, refetch: refetchImmunizations } = trpc.clinical.getImmunizations.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  // Mutations
  const createProblemMutation = trpc.clinical.createProblem.useMutation({
    onSuccess: () => {
      toast.success("Problem added successfully");
      setShowAddDialog(false);
      refetchProblems();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const createAllergyMutation = trpc.clinical.createAllergy.useMutation({
    onSuccess: () => {
      toast.success("Allergy added successfully");
      setShowAddDialog(false);
      refetchAllergies();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const createMedicationMutation = trpc.clinical.createMedication.useMutation({
    onSuccess: () => {
      toast.success("Medication added successfully");
      setShowAddDialog(false);
      refetchMedications();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const createImmunizationMutation = trpc.clinical.createImmunization.useMutation({
    onSuccess: () => {
      toast.success("Immunization added successfully");
      setShowAddDialog(false);
      refetchImmunizations();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteProblemMutation = trpc.clinical.deleteProblem.useMutation({
    onSuccess: () => {
      toast.success("Problem deleted");
      refetchProblems();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteAllergyMutation = trpc.clinical.deleteAllergy.useMutation({
    onSuccess: () => {
      toast.success("Allergy deleted");
      refetchAllergies();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMedicationMutation = trpc.clinical.deleteMedication.useMutation({
    onSuccess: () => {
      toast.success("Medication deleted");
      refetchMedications();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteImmunizationMutation = trpc.clinical.deleteImmunization.useMutation({
    onSuccess: () => {
      toast.success("Immunization deleted");
      refetchImmunizations();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "mild":
        return "bg-blue-100 text-blue-800";
      case "moderate":
        return "bg-yellow-100 text-yellow-800";
      case "severe":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "resolved":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate("/patients")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Clinical Chart</h1>
          <p className="text-gray-600">Comprehensive medical record for patient</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="problems">Problems</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          </TabsList>

          {/* Problems Tab */}
          <TabsContent value="problems" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Active Problems</h2>
              <Dialog open={showAddDialog && activeTab === "problems"} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Problem
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Problem</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createProblemMutation.mutate({
                        patientId,
                        icdCode: formData.get("icdCode") as string,
                        description: formData.get("description") as string,
                        status: "active",
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ICD Code</label>
                      <Input name="icdCode" placeholder="e.g., I10" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <Input name="description" placeholder="Problem description" required />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Problem
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {problemsLoading ? (
              <div className="text-center py-12">Loading problems...</div>
            ) : problems && problems.length > 0 ? (
              <div className="grid gap-4">
                {problems.map((problem) => (
                  <Card key={problem.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{problem.description}</h3>
                          <Badge className={getStatusColor(problem.status ?? undefined)}>{problem.status ?? 'unknown'}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">ICD Code: {problem.icdCode}</p>
                        {problem.onsetDate && (
                          <p className="text-sm text-gray-600">
                            Onset: {new Date(problem.onsetDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProblemMutation.mutate({ id: problem.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No active problems recorded</div>
            )}
          </TabsContent>

          {/* Allergies Tab */}
          <TabsContent value="allergies" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Allergies</h2>
              <Dialog open={showAddDialog && activeTab === "allergies"} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Allergy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Allergy</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const severity = formData.get("severity") as string;
                      createAllergyMutation.mutate({
                        patientId,
                        allergen: formData.get("allergen") as string,
                        severity: (severity && ['mild', 'moderate', 'severe'].includes(severity)) ? (severity as 'mild' | 'moderate' | 'severe') : undefined,
                        notes: (formData.get("notes") as string) || undefined,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Allergen</label>
                      <Input name="allergen" placeholder="e.g., Penicillin" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                      <Select name="severity">
                        <SelectTrigger>
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="severe">Severe</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reaction</label>
                      <Input name="reaction" placeholder="e.g., Rash, Anaphylaxis" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <Textarea name="notes" placeholder="Additional notes" />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Allergy
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {allergiesLoading ? (
              <div className="text-center py-12">Loading allergies...</div>
            ) : allergies && allergies.length > 0 ? (
              <div className="grid gap-4">
                {allergies.map((allergy) => (
                  <Card key={allergy.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                          <h3 className="text-lg font-semibold text-gray-900">{allergy.allergen}</h3>
                          {allergy.severity && <Badge className={getSeverityColor(allergy.severity)}>{allergy.severity}</Badge>}
                        </div>
                        {allergy.reaction && <p className="text-sm text-gray-600">Reaction: {allergy.reaction}</p>}
                        {allergy.notes && <p className="text-sm text-gray-600 mt-2">{allergy.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteAllergyMutation.mutate({ id: allergy.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No allergies recorded</div>
            )}
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Current Medications</h2>
              <Dialog open={showAddDialog && activeTab === "medications"} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Medication
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Medication</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createMedicationMutation.mutate({
                        patientId,
                        medicationName: formData.get("medicationName") as string,
                        dosage: (formData.get("dosage") as string) || undefined,
                        frequency: (formData.get("frequency") as string) || undefined,
                        route: (formData.get("route") as string) || undefined,
                        status: "active",
                        indication: (formData.get("indication") as string) || undefined,
                        notes: (formData.get("notes") as string) || undefined,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
                      <Input name="medicationName" placeholder="e.g., Lisinopril" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                      <Input name="dosage" placeholder="e.g., 10 mg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                      <Input name="frequency" placeholder="e.g., Once daily" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                      <Input name="route" placeholder="e.g., Oral" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Indication</label>
                      <Input name="indication" placeholder="e.g., Hypertension" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <Textarea name="notes" placeholder="Additional notes" />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Medication
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {medicationsLoading ? (
              <div className="text-center py-12">Loading medications...</div>
            ) : medications && medications.length > 0 ? (
              <div className="grid gap-4">
                {medications.map((med) => (
                  <Card key={med.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{med.medicationName}</h3>
                          <Badge className={getStatusColor(med.status ?? undefined)}>{med.status ?? 'unknown'}</Badge>
                        </div>
                        {med.dosage && <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>}
                        {med.frequency && <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>}
                        {med.route && <p className="text-sm text-gray-600">Route: {med.route}</p>}
                        {med.indication && <p className="text-sm text-gray-600 mt-2">Indication: {med.indication}</p>}
                        {med.notes && <p className="text-sm text-gray-600 mt-2">{med.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMedicationMutation.mutate({ id: med.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No medications recorded</div>
            )}
          </TabsContent>

          {/* Immunizations Tab */}
          <TabsContent value="immunizations" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Immunizations</h2>
              <Dialog open={showAddDialog && activeTab === "immunizations"} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Immunization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Immunization</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      createImmunizationMutation.mutate({
                        patientId,
                        vaccineName: formData.get("vaccineName") as string,
                        administrationDate: new Date(formData.get("administrationDate") as string),
                        lot: (formData.get("lot") as string) || undefined,
                        site: (formData.get("site") as string) || undefined,
                        route: (formData.get("route") as string) || undefined,
                        manufacturer: (formData.get("manufacturer") as string) || undefined,
                        notes: (formData.get("notes") as string) || undefined,
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vaccine Name</label>
                      <Input name="vaccineName" placeholder="e.g., COVID-19" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Administration Date</label>
                      <Input name="administrationDate" type="date" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                      <Input name="lot" placeholder="Lot number" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                      <Input name="site" placeholder="e.g., Left arm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                      <Input name="route" placeholder="e.g., Intramuscular" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                      <Input name="manufacturer" placeholder="Manufacturer" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <Textarea name="notes" placeholder="Additional notes" />
                    </div>
                    <Button type="submit" className="w-full">
                      Add Immunization
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {immunizationsLoading ? (
              <div className="text-center py-12">Loading immunizations...</div>
            ) : immunizations && immunizations.length > 0 ? (
              <div className="grid gap-4">
                {immunizations.map((imm) => (
                  <Card key={imm.id} className="p-4 hover:shadow-md transition-shadow border-l-4 border-l-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <h3 className="text-lg font-semibold text-gray-900">{imm.vaccineName}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          Date: {new Date(imm.administrationDate).toLocaleDateString()}
                        </p>
                        {imm.site && <p className="text-sm text-gray-600">Site: {imm.site}</p>}
                        {imm.notes && <p className="text-sm text-gray-600 mt-2">{imm.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteImmunizationMutation.mutate({ id: imm.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">No immunizations recorded</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
