import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Calendar, Clock, User, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function Appointments() {
  const [location, navigate] = useLocation();
  const patientId = parseInt(location.split("/")[2]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Queries
  const { data: appointments, isLoading, refetch } = trpc.appointments.getAppointments.useQuery(
    { patientId, limit: 100 },
    { enabled: !!patientId }
  );

  const { data: upcomingAppointments } = trpc.appointments.getUpcomingAppointments.useQuery(
    { patientId, limit: 10 },
    { enabled: !!patientId }
  );

  // Mutations
  const createAppointmentMutation = trpc.appointments.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment created successfully");
      setShowAddDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const updateAppointmentMutation = trpc.appointments.updateAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment updated successfully");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteAppointmentMutation = trpc.appointments.deleteAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment deleted");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no-show":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const appointmentData = {
      patientId,
      appointmentDate: new Date(formData.get("appointmentDate") as string),
      provider: (formData.get("provider") as string) || undefined,
      appointmentType: (formData.get("appointmentType") as string) || undefined,
      location: (formData.get("location") as string) || undefined,
      status: (formData.get("status") as any) || "scheduled",
      notes: (formData.get("notes") as string) || undefined,
    };

    createAppointmentMutation.mutate(appointmentData as any);
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "TBD";
    try {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return timeStr;
    }
  };

  const isUpcoming = (date: Date) => {
    return new Date(date) > new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Button variant="ghost" onClick={() => navigate("/patients")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Appointments</h1>
          <p className="text-gray-600">Manage patient appointments and scheduling</p>
        </div>

        {/* Upcoming Appointments Summary */}
        {upcomingAppointments && upcomingAppointments.length > 0 && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingAppointments.slice(0, 3).map((apt) => (
                <div key={apt.id} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                  <p className="font-semibold text-gray-900">
                    {new Date(apt.appointmentDate).toLocaleDateString()}
                  </p>

                  {apt.provider && (
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <User className="w-4 h-4" />
                      {apt.provider}
                    </p>
                  )}
                  {apt.appointmentType && (
                    <Badge variant="outline" className="mt-2">
                      {apt.appointmentType}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Add Appointment Button */}
        <div className="mb-8">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Date</label>
                    <Input name="appointmentDate" type="date" required />
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                    <Input name="provider" placeholder="Provider name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                    <Input name="appointmentType" placeholder="e.g., Checkup, Follow-up" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <Input name="location" placeholder="Office location or virtual" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select name="status" defaultValue="scheduled">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no-show">No-Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <Input name="notes" placeholder="Additional notes" />
                </div>

                <Button type="submit" className="w-full">
                  Schedule Appointment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Appointments List */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">All Appointments</h2>
          {isLoading ? (
            <div className="text-center py-12">Loading appointments...</div>
          ) : appointments && appointments.length > 0 ? (
            <div className="grid gap-4">
              {appointments
                .sort((a: any, b: any) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
                .map((apt: any) => (
                  <Card
                    key={apt.id}
                    className={`p-4 hover:shadow-md transition-shadow ${
                      isUpcoming(apt.appointmentDate) ? "border-l-4 border-green-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="w-5 h-5 text-green-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {new Date(apt.appointmentDate).toLocaleDateString()}
                          </h3>
                          <Badge className={getStatusColor(apt.status ?? "scheduled")}>
                            {apt.status ?? "scheduled"}
                          </Badge>
                          {apt.appointmentType && <Badge variant="outline">{apt.appointmentType}</Badge>}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-2">

                          {apt.provider && (
                            <p className="text-gray-700 flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {apt.provider}
                            </p>
                          )}
                          {apt.location && (
                            <p className="text-gray-700 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {apt.location}
                            </p>
                          )}
                        </div>

                        {apt.notes && <p className="text-sm text-gray-600 mt-2">Notes: {apt.notes}</p>}
                      </div>

                      <div className="flex gap-2">
                        {apt.status === "scheduled" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateAppointmentMutation.mutate({
                                id: apt.id,
                                status: "confirmed",
                              } as any)
                            }
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAppointmentMutation.mutate({ id: apt.id })}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No appointments scheduled</div>
          )}
        </div>
      </div>
    </div>
  );
}
