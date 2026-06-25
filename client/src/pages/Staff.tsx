import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CalendarClock, Stethoscope, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STAFF_TYPE_LABELS: Record<string, string> = {
  doctor: "Doctor",
  nurse_practitioner: "Nurse Practitioner",
  dietitian: "Dietitian",
};

export default function Staff() {
  const [, navigate] = useLocation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const utils = trpc.useUtils();

  const { data: staff, isLoading } = trpc.staff.list.useQuery({ includeInactive: true });

  const createMutation = trpc.staff.create.useMutation({
    onSuccess: () => {
      toast.success("Staff member added");
      setShowAddDialog(false);
      utils.staff.list.invalidate();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateMutation = trpc.staff.update.useMutation({
    onSuccess: () => utils.staff.list.invalidate(),
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteMutation = trpc.staff.delete.useMutation({
    onSuccess: () => {
      toast.success("Staff member removed");
      utils.staff.list.invalidate();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      staffType: formData.get("staffType") as "doctor" | "nurse_practitioner" | "dietitian",
      specialty: (formData.get("specialty") as string) || undefined,
      status: "active",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Staff</h1>
            <p className="text-gray-600">Manage providers and their schedules</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/locations")} className="gap-2">
            <MapPin className="w-4 h-4" />
            Locations
          </Button>
        </div>

        <div className="mb-8">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Staff Member</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <Input name="firstName" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <Input name="lastName" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <Select name="staffType" defaultValue="doctor">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="nurse_practitioner">Nurse Practitioner</SelectItem>
                        <SelectItem value="dietitian">Dietitian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
                    <Input name="specialty" placeholder="e.g., Cardiology" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  Add Staff Member
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading staff...</div>
        ) : staff && staff.length > 0 ? (
          <div className="grid gap-4">
            {staff.map((member) => (
              <Card key={member.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member.firstName} {member.lastName}
                        </h3>
                        <Badge variant="outline">{STAFF_TYPE_LABELS[member.staffType] ?? member.staffType}</Badge>
                        {member.status === "inactive" && (
                          <Badge className="bg-gray-200 text-gray-700">Inactive</Badge>
                        )}
                      </div>
                      {member.specialty && (
                        <p className="text-sm text-gray-600">{member.specialty}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => navigate(`/staff/${member.id}`)}
                    >
                      <CalendarClock className="w-4 h-4" />
                      Schedule
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({
                          id: member.id,
                          status: member.status === "active" ? "inactive" : "active",
                        })
                      }
                    >
                      {member.status === "active" ? "Deactivate" : "Reactivate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Remove ${member.firstName} ${member.lastName}?`)) {
                          deleteMutation.mutate({ id: member.id });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">No staff members yet</div>
        )}
      </div>
    </div>
  );
}
