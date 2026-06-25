import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, ArrowLeft, Calendar, User, MapPin, AlertTriangle, Clock } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { generateOpenSlots } from "@shared/scheduling";

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function Appointments() {
  const [location, navigate] = useLocation();
  // Patient scope: taken from the URL on /patients/:id/appointments, otherwise
  // chosen from a dropdown on the global /appointments screen.
  const isPatientScoped = location.startsWith("/patients/");
  const urlPatientId = parseInt(location.split("/")[2]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const patientId = isPatientScoped
    ? urlPatientId
    : selectedPatientId
      ? parseInt(selectedPatientId)
      : NaN;
  const hasPatient = Number.isFinite(patientId);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Controlled add-appointment form state
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00");
  const [duration, setDuration] = useState("30");
  const [staffId, setStaffId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [notes, setNotes] = useState("");

  // Queries
  const { data: patientsList } = trpc.patients.list.useQuery(
    { limit: 200, offset: 0 },
    { enabled: !isPatientScoped }
  );
  const { data: patient } = trpc.patients.getById.useQuery(
    { id: patientId },
    { enabled: hasPatient }
  );
  const { data: appointments, isLoading, refetch } = trpc.appointments.getAppointments.useQuery(
    { patientId, limit: 100 },
    { enabled: hasPatient }
  );
  const { data: staff } = trpc.staff.list.useQuery({ includeInactive: false });
  const { data: locations } = trpc.locations.list.useQuery({ includeInactive: false });

  const staffMap = useMemo(
    () => new Map((staff ?? []).map((s) => [s.id, `${s.firstName} ${s.lastName}`])),
    [staff]
  );
  const locationMap = useMemo(
    () => new Map((locations ?? []).map((l) => [l.id, l.name])),
    [locations]
  );

  // Live availability for the chosen staff member + date (stable Date ref).
  const availabilityDate = useMemo(() => (date ? new Date(`${date}T12:00:00`) : null), [date]);
  const slotsEnabled = !!staffId && !!availabilityDate;
  const { data: availability } = trpc.staff.getAvailability.useQuery(
    { staffId: parseInt(staffId), date: availabilityDate as Date },
    { enabled: slotsEnabled }
  );
  const { data: daySchedule } = trpc.appointments.getStaffDaySchedule.useQuery(
    { staffId: parseInt(staffId), date: availabilityDate as Date },
    { enabled: slotsEnabled }
  );

  // Open slots = availability blocks stepped by the appointment length, minus
  // anything already booked that day.
  const openSlots = useMemo(() => {
    if (!availability) return [];
    const busy = (daySchedule ?? []).map((a) => {
      const d = new Date(a.appointmentDate);
      const start = d.getHours() * 60 + d.getMinutes();
      return { start, end: start + (a.duration ?? 30) };
    });
    return generateOpenSlots(availability, busy, parseInt(duration) || 30, locationId ? parseInt(locationId) : undefined);
  }, [availability, daySchedule, duration, locationId]);

  const createAppointmentMutation = trpc.appointments.createAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment created successfully");
      setShowAddDialog(false);
      resetForm();
      refetch();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateAppointmentMutation = trpc.appointments.updateAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment updated successfully");
      refetch();
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`),
  });

  const deleteAppointmentMutation = trpc.appointments.deleteAppointment.useMutation({
    onSuccess: () => {
      toast.success("Appointment deleted");
      refetch();
    },
    onError: (error: any) => toast.error(`Error: ${error.message}`),
  });

  const resetForm = () => {
    setDate("");
    setTime("09:00");
    setDuration("30");
    setStaffId("");
    setLocationId("");
    setAppointmentType("");
    setStatus("scheduled");
    setNotes("");
  };

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
    if (!hasPatient) {
      toast.error("Please select a patient first");
      return;
    }
    if (!date) {
      toast.error("Please choose a date");
      return;
    }
    createAppointmentMutation.mutate({
      patientId,
      appointmentDate: new Date(`${date}T${time}:00`),
      duration: parseInt(duration) || undefined,
      staffId: staffId ? parseInt(staffId) : undefined,
      locationId: locationId ? parseInt(locationId) : undefined,
      appointmentType: appointmentType || undefined,
      status: status as any,
      notes: notes || undefined,
      // Wall-clock the user picked, so server availability checks are
      // timezone-independent of where the server runs.
      scheduleDate: date,
      scheduleTime: time,
    });
  };

  const isUpcoming = (d: Date) => new Date(d) > new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/patients")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Patients
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Appointments</h1>
          <p className="text-gray-600">
            {patient
              ? `Scheduling for ${patient.firstName} ${patient.lastName}`
              : "Manage patient appointments and scheduling"}
          </p>
        </div>

        {/* Patient selector (global screen only) */}
        {!isPatientScoped && (
          <div className="mb-6 max-w-sm">
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a patient" />
              </SelectTrigger>
              <SelectContent>
                {(patientsList ?? []).map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.firstName} {p.lastName}
                    {p.mrn ? ` (${p.mrn})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Add Appointment Button */}
        <div className="mb-8">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={!hasPatient}>
                <Plus className="w-4 h-4" />
                Schedule Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                    {slotsEnabled ? (
                      <Select value={time} onValueChange={setTime} disabled={openSlots.length === 0}>
                        <SelectTrigger>
                          <SelectValue placeholder={openSlots.length ? "Open slot" : "No slots"} />
                        </SelectTrigger>
                        <SelectContent>
                          {openSlots.map((s) => (
                            <SelectItem key={s.startTime} value={s.startTime}>
                              {formatTime(s.startTime)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <Input
                      type="number"
                      min={5}
                      step={5}
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member</label>
                    <Select value={staffId} onValueChange={setStaffId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {(staff ?? []).map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.firstName} {s.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <Select value={locationId} onValueChange={setLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {(locations ?? []).map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Availability hint for the chosen staff member + date */}
                {slotsEnabled && availability && (() => {
                  const locId = locationId ? parseInt(locationId) : null;
                  const locationBlocks =
                    locId == null
                      ? availability
                      : availability.filter((b) => b.locationId == null || b.locationId === locId);
                  if (availability.length === 0) {
                    return (
                      <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                        <AlertTriangle className="w-4 h-4" />
                        This staff member is not scheduled to work on that date.
                      </div>
                    );
                  }
                  if (locationBlocks.length === 0) {
                    return (
                      <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                        <AlertTriangle className="w-4 h-4" />
                        Not working at this location on that date.
                      </div>
                    );
                  }
                  if (openSlots.length === 0) {
                    return (
                      <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                        <AlertTriangle className="w-4 h-4" />
                        Fully booked that day — no open {duration}-minute slots.
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      Working hours:{" "}
                      {locationBlocks.map((b) => `${formatTime(b.startTime)}–${formatTime(b.endTime)}`).join(", ")}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                    <Input
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      placeholder="e.g., Checkup, Follow-up"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no-show">No-Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes" />
                </div>

                <Button type="submit" className="w-full" disabled={createAppointmentMutation.isPending}>
                  Schedule Appointment
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Appointments List */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">All Appointments</h2>
          {!hasPatient ? (
            <div className="text-center py-12 text-gray-500">
              Select a patient to view and schedule appointments.
            </div>
          ) : isLoading ? (
            <div className="text-center py-12">Loading appointments...</div>
          ) : appointments && appointments.length > 0 ? (
            <div className="grid gap-4">
              {appointments
                .slice()
                .sort((a: any, b: any) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
                .map((apt: any) => {
                  const providerLabel = apt.staffId ? staffMap.get(apt.staffId) : apt.provider;
                  const locationLabel = apt.locationId ? locationMap.get(apt.locationId) : apt.location;
                  return (
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
                              {new Date(apt.appointmentDate).toLocaleString([], {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </h3>
                            <Badge className={getStatusColor(apt.status ?? "scheduled")}>
                              {apt.status ?? "scheduled"}
                            </Badge>
                            {apt.appointmentType && <Badge variant="outline">{apt.appointmentType}</Badge>}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mt-2">
                            {providerLabel && (
                              <p className="text-gray-700 flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {providerLabel}
                              </p>
                            )}
                            {locationLabel && (
                              <p className="text-gray-700 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {locationLabel}
                              </p>
                            )}
                          </div>

                          {apt.notes && <p className="text-sm text-gray-600 mt-2">Notes: {apt.notes}</p>}
                        </div>

                        <div className="flex gap-2">
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
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No appointments scheduled</div>
          )}
        </div>
      </div>
    </div>
  );
}
