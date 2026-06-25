import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const STAFF_TYPE_LABELS: Record<string, string> = {
  doctor: "Doctor",
  nurse_practitioner: "Nurse Practitioner",
  dietitian: "Dietitian",
};

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function StaffDetail() {
  const [location, navigate] = useLocation();
  const staffId = parseInt(location.split("/")[2]);
  const utils = trpc.useUtils();
  const [exceptionType, setExceptionType] = useState<"time_off" | "custom_hours">("time_off");

  const { data: member } = trpc.staff.getById.useQuery({ id: staffId }, { enabled: !!staffId });
  const { data: locations } = trpc.locations.list.useQuery({ includeInactive: false });
  const { data: weekly } = trpc.staff.getWeeklySchedules.useQuery({ staffId }, { enabled: !!staffId });
  const { data: exceptions } = trpc.staff.getExceptions.useQuery({ staffId }, { enabled: !!staffId });

  const locationName = (id?: number | null) =>
    id ? locations?.find((l) => l.id === id)?.name : undefined;

  const addWeekly = trpc.staff.addWeeklySchedule.useMutation({
    onSuccess: () => {
      toast.success("Hours added");
      utils.staff.getWeeklySchedules.invalidate({ staffId });
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
  const deleteWeekly = trpc.staff.deleteWeeklySchedule.useMutation({
    onSuccess: () => utils.staff.getWeeklySchedules.invalidate({ staffId }),
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
  const addException = trpc.staff.addException.useMutation({
    onSuccess: () => {
      toast.success("Exception added");
      utils.staff.getExceptions.invalidate({ staffId });
    },
    onError: (e) => toast.error(`Error: ${e.message}`),
  });
  const deleteException = trpc.staff.deleteException.useMutation({
    onSuccess: () => utils.staff.getExceptions.invalidate({ staffId }),
    onError: (e) => toast.error(`Error: ${e.message}`),
  });

  const handleAddWeekly = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const locationId = fd.get("locationId") as string;
    addWeekly.mutate(
      {
        staffId,
        dayOfWeek: parseInt(fd.get("dayOfWeek") as string),
        startTime: fd.get("startTime") as string,
        endTime: fd.get("endTime") as string,
        locationId: locationId ? parseInt(locationId) : undefined,
      },
      { onSuccess: () => form.reset() }
    );
  };

  const handleAddException = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const dateStr = fd.get("date") as string;
    const locationId = fd.get("locationId") as string;
    addException.mutate(
      {
        staffId,
        // Anchor at local noon so the calendar day doesn't shift across timezones.
        date: new Date(`${dateStr}T12:00:00`),
        type: exceptionType,
        startTime: exceptionType === "custom_hours" ? (fd.get("startTime") as string) : undefined,
        endTime: exceptionType === "custom_hours" ? (fd.get("endTime") as string) : undefined,
        locationId: locationId ? parseInt(locationId) : undefined,
        reason: (fd.get("reason") as string) || undefined,
      },
      { onSuccess: () => form.reset() }
    );
  };

  const weeklyByDay = (day: number) => (weekly ?? []).filter((w) => w.dayOfWeek === day);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/staff")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff
        </Button>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              {member ? `${member.firstName} ${member.lastName}` : "Staff"}
            </h1>
            {member && (
              <Badge variant="outline">{STAFF_TYPE_LABELS[member.staffType] ?? member.staffType}</Badge>
            )}
          </div>
          {member?.specialty && <p className="text-gray-600 mt-1">{member.specialty}</p>}
        </div>

        {/* Weekly recurring hours */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Weekly Hours</h2>
          <div className="space-y-2 mb-6">
            {DAYS.map((dayName, day) => {
              const blocks = weeklyByDay(day);
              return (
                <div key={day} className="flex items-start gap-4 py-2 border-b last:border-b-0">
                  <div className="w-28 font-medium text-gray-700 shrink-0">{dayName}</div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    {blocks.length === 0 ? (
                      <span className="text-sm text-gray-400">Off</span>
                    ) : (
                      blocks.map((b) => (
                        <span
                          key={b.id}
                          className="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-md px-2 py-1 text-sm"
                        >
                          {formatTime(b.startTime)}–{formatTime(b.endTime)}
                          {locationName(b.locationId) && (
                            <span className="text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {locationName(b.locationId)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => deleteWeekly.mutate({ id: b.id })}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAddWeekly} className="flex flex-wrap items-end gap-3 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
              <Select name="dayOfWeek" defaultValue="1">
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
              <Input name="startTime" type="time" required className="w-32" defaultValue="09:00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
              <Input name="endTime" type="time" required className="w-32" defaultValue="17:00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <Select name="locationId" defaultValue="">
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Any" />
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
            <Button type="submit" className="gap-1" disabled={addWeekly.isPending}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </form>
        </Card>

        {/* Date-specific exceptions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Schedule Exceptions</h2>
          <p className="text-sm text-gray-500 mb-4">
            Time off and one-off hour changes that override the weekly template.
          </p>

          <div className="space-y-2 mb-6">
            {exceptions && exceptions.length > 0 ? (
              exceptions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between py-2 px-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-700">
                      {new Date(ex.date).toLocaleDateString()}
                    </span>
                    {ex.type === "time_off" ? (
                      <Badge className="bg-orange-100 text-orange-800">Time Off</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">
                        {ex.startTime && ex.endTime
                          ? `${formatTime(ex.startTime)}–${formatTime(ex.endTime)}`
                          : "Custom Hours"}
                      </Badge>
                    )}
                    {locationName(ex.locationId) && (
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {locationName(ex.locationId)}
                      </span>
                    )}
                    {ex.reason && <span className="text-sm text-gray-500">{ex.reason}</span>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteException.mutate({ id: ex.id })}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">No exceptions</p>
            )}
          </div>

          <form onSubmit={handleAddException} className="flex flex-wrap items-end gap-3 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <Input name="date" type="date" required className="w-40" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
              <Select
                value={exceptionType}
                onValueChange={(v) => setExceptionType(v as "time_off" | "custom_hours")}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time_off">Time Off</SelectItem>
                  <SelectItem value="custom_hours">Custom Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {exceptionType === "custom_hours" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start</label>
                  <Input name="startTime" type="time" className="w-32" defaultValue="09:00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End</label>
                  <Input name="endTime" type="time" className="w-32" defaultValue="13:00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <Select name="locationId" defaultValue="">
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Any" />
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
              </>
            )}
            <div className="flex-1 min-w-[8rem]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
              <Input name="reason" placeholder="Optional" />
            </div>
            <Button type="submit" className="gap-1" disabled={addException.isPending}>
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
