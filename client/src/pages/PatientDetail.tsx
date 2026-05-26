import { useLocation } from "wouter";
import { ArrowLeft, Loader2, AlertCircle, Edit2, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function PatientDetail({ patientId }: { patientId: number }) {
  const [, navigate] = useLocation();
  const [editOpen, setEditOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [providerOpen, setProviderOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: patient, isLoading, error } = trpc.patients.getById.useQuery({ id: patientId });
  const { data: insurance = [] } = trpc.patients.getInsurance.useQuery({ patientId });
  const { data: providerTeam = [] } = trpc.patients.getProviderTeam.useQuery({ patientId });
  const { data: problems = [] } = trpc.clinical.getProblems.useQuery({ patientId });
  const { data: allergies = [] } = trpc.clinical.getAllergies.useQuery({ patientId });
  const { data: medications = [] } = trpc.clinical.getMedications.useQuery({ patientId });
  const { data: vitals = [] } = trpc.vitals.getVitals.useQuery({ patientId, limit: 5 });
  const { data: visits = [] } = trpc.visits.getVisitNotes.useQuery({ patientId, limit: 5 });
  const { data: appointments = [] } = trpc.appointments.getAppointments.useQuery({ patientId, limit: 5 });

  const updatePatientMutation = trpc.patients.update.useMutation({
    onSuccess: () => {
      toast.success("Patient updated successfully");
      setEditOpen(false);
      trpc.useUtils().patients.getById.invalidate();
    },
    onError: () => toast.error("Failed to update patient"),
  });

  const deletePatientMutation = trpc.patients.delete.useMutation({
    onSuccess: () => {
      toast.success("Patient deleted successfully");
      navigate("/patients");
    },
    onError: () => toast.error("Failed to delete patient"),
  });

  const addInsuranceMutation = trpc.patients.addInsurance.useMutation({
    onSuccess: () => {
      toast.success("Insurance added successfully");
      setInsuranceOpen(false);
      trpc.useUtils().patients.getInsurance.invalidate();
    },
    onError: () => toast.error("Failed to add insurance"),
  });

  const addProviderMutation = trpc.patients.addProvider.useMutation({
    onSuccess: () => {
      toast.success("Provider added successfully");
      setProviderOpen(false);
      trpc.useUtils().patients.getProviderTeam.invalidate();
    },
    onError: () => toast.error("Failed to add provider"),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/patients")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>
        <div className="card-base text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/patients")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>
        <div className="card-base border border-red-200 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-semibold text-red-900">Error loading patient</p>
              <p className="text-sm text-red-700">{error?.message || "Patient not found"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const age = patient.dateOfBirth
    ? Math.floor((new Date().getTime() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/patients")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button className="btn-outline">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Patient</DialogTitle>
              </DialogHeader>
              <EditPatientForm
                patient={patient}
                onSubmit={(data: any) => updatePatientMutation.mutate(data)}
              />
            </DialogContent>
          </Dialog>
          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <Button onClick={() => setDeleteOpen(true)} className="btn-outline text-red-600 hover:text-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Patient</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this patient? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex gap-2 justify-end">
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deletePatientMutation.mutate({ id: patientId })}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </div>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="card-base">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {patient.firstName} {patient.lastName}
            </h1>
            <div className="space-y-1 text-muted-foreground">
              <p>MRN: <span className="font-mono text-foreground">{patient.mrn || "—"}</span></p>
              {age && <p>Age: <span className="text-foreground">{age} years old</span></p>}
              {patient.gender && <p>Gender: <span className="text-foreground">{patient.gender}</span></p>}
              <p>Status: <span className={`badge-${patient.status === "active" ? "success" : "warning"}`}>{patient.status}</span></p>
            </div>
          </div>
        </div>

        <div className="section-divider" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Email</h3>
            <p className="text-foreground">{patient.email || "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Phone</h3>
            <p className="text-foreground">{patient.phone || "—"}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Address</h3>
            <p className="text-foreground">
              {patient.address && `${patient.address}, ${patient.city}, ${patient.state} ${patient.zipCode}`}
              {!patient.address && "—"}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Date of Birth</h3>
            <p className="text-foreground">
              {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "MMM d, yyyy") : "—"}
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="clinical">Clinical</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="card-base">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Active Problems</p>
                <p className="text-2xl font-bold text-foreground">{problems?.length || 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Medications</p>
                <p className="text-2xl font-bold text-foreground">{medications?.length || 0}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Allergies</p>
                <p className="text-2xl font-bold text-foreground">{allergies?.length || 0}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insurance" className="space-y-6">
          <div className="card-base">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Insurance Information</h3>
              <Dialog open={insuranceOpen} onOpenChange={setInsuranceOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Insurance
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Insurance</DialogTitle>
                  </DialogHeader>
                  <AddInsuranceForm
                    patientId={patientId}
                    onSubmit={(data: any) => addInsuranceMutation.mutate(data)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {insurance && insurance.length > 0 ? (
              <div className="space-y-4">
                {insurance.map((ins: any) => (
                  <div key={ins.id} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">{ins.insuranceProvider}</h4>
                      {ins.isPrimary && <span className="badge-info">Primary</span>}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Member ID: {ins.memberId}</p>
                      {ins.groupNumber && <p>Group: {ins.groupNumber}</p>}
                      {ins.planName && <p>Plan: {ins.planName}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No insurance information on file</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="card-base">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Provider Team</h3>
              <Dialog open={providerOpen} onOpenChange={setProviderOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-primary" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Provider</DialogTitle>
                  </DialogHeader>
                  <AddProviderForm
                    patientId={patientId}
                    onSubmit={(data: any) => addProviderMutation.mutate(data)}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {providerTeam && providerTeam.length > 0 ? (
              <div className="space-y-4">
                {providerTeam.map((provider: any) => (
                  <div key={provider.id} className="p-4 border border-border rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">{provider.providerName}</h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {provider.specialty && <p>Specialty: {provider.specialty}</p>}
                      {provider.role && <p>Role: {provider.role}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No providers assigned</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="clinical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-base">
              <h3 className="text-lg font-semibold text-foreground mb-4">Active Problems</h3>
              {problems && problems.length > 0 ? (
                <ul className="space-y-2">
                  {problems.slice(0, 5).map((problem: any) => (
                    <li key={problem.id} className="text-sm text-foreground">
                      • {problem.description}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No problems documented</p>
              )}
            </div>

            <div className="card-base">
              <h3 className="text-lg font-semibold text-foreground mb-4">Allergies</h3>
              {allergies && allergies.length > 0 ? (
                <ul className="space-y-2">
                  {allergies.slice(0, 5).map((allergy: any) => (
                    <li key={allergy.id} className="text-sm text-foreground">
                      • {allergy.allergen}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">No allergies documented</p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="card-base">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {visits && visits.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Recent Visits</h4>
                  <ul className="space-y-2">
                    {visits.slice(0, 3).map((visit: any) => (
                      <li key={visit.id} className="text-sm text-muted-foreground">
                        {format(new Date(visit.visitDate), "MMM d, yyyy")} - {visit.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {appointments && appointments.length > 0 && (
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Upcoming Appointments</h4>
                  <ul className="space-y-2">
                    {appointments.slice(0, 3).map((apt: any) => (
                      <li key={apt.id} className="text-sm text-muted-foreground">
                        {format(new Date(apt.appointmentDate), "MMM d, yyyy")} - {apt.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EditPatientForm({ patient, onSubmit }: any) {
  const [formData, setFormData] = useState({
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email || "",
    phone: patient.phone || "",
    gender: patient.gender || "",
    address: patient.address || "",
    city: patient.city || "",
    state: patient.state || "",
    zipCode: patient.zipCode || "",
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>First Name</Label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label>Last Name</Label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          />
        </div>
      </div>
      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>
      <div>
        <Label>Phone</Label>
        <Input
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>
      <div>
        <Label>Gender</Label>
        <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="M">Male</SelectItem>
            <SelectItem value="F">Female</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
            <SelectItem value="Unknown">Unknown</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>City</Label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div>
          <Label>State</Label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div>
          <Label>ZIP Code</Label>
          <Input
            value={formData.zipCode}
            onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
          />
        </div>
      </div>
      <Button onClick={() => onSubmit(formData)} className="w-full">
        Save Changes
      </Button>
    </div>
  );
}

function AddInsuranceForm({ patientId, onSubmit }: any) {
  const [formData, setFormData] = useState({
    patientId,
    insuranceProvider: "",
    memberId: "",
    groupNumber: "",
    planName: "",
    isPrimary: true,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Insurance Provider</Label>
        <Input
          value={formData.insuranceProvider}
          onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
          placeholder="e.g., Blue Cross Blue Shield"
        />
      </div>
      <div>
        <Label>Member ID</Label>
        <Input
          value={formData.memberId}
          onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
        />
      </div>
      <div>
        <Label>Group Number</Label>
        <Input
          value={formData.groupNumber}
          onChange={(e) => setFormData({ ...formData, groupNumber: e.target.value })}
        />
      </div>
      <div>
        <Label>Plan Name</Label>
        <Input
          value={formData.planName}
          onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPrimary"
          checked={formData.isPrimary}
          onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
        />
        <Label htmlFor="isPrimary">Primary Insurance</Label>
      </div>
      <Button onClick={() => onSubmit(formData)} className="w-full">
        Add Insurance
      </Button>
    </div>
  );
}

function AddProviderForm({ patientId, onSubmit }: any) {
  const [formData, setFormData] = useState({
    patientId,
    providerName: "",
    specialty: "",
    role: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Provider Name</Label>
        <Input
          value={formData.providerName}
          onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
          placeholder="e.g., Dr. John Smith"
        />
      </div>
      <div>
        <Label>Specialty</Label>
        <Input
          value={formData.specialty}
          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          placeholder="e.g., Cardiology"
        />
      </div>
      <div>
        <Label>Role</Label>
        <Input
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          placeholder="e.g., Primary Care Physician"
        />
      </div>
      <Button onClick={() => onSubmit(formData)} className="w-full">
        Add Provider
      </Button>
    </div>
  );
}
