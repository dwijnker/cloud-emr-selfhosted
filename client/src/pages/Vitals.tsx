import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ArrowLeft, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Vitals() {
  const [location, navigate] = useLocation();
  const patientId = parseInt(location.split("/")[2]);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Queries
  const { data: vitals, isLoading, refetch } = trpc.vitals.getVitals.useQuery(
    { patientId, limit: 50 },
    { enabled: !!patientId }
  );

  const { data: latestVital } = trpc.vitals.getLatestVital.useQuery(
    { patientId },
    { enabled: !!patientId }
  );

  // Mutations
  const createVitalMutation = trpc.vitals.createVital.useMutation({
    onSuccess: () => {
      toast.success("Vital recorded successfully");
      setShowAddDialog(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteVitalMutation = trpc.vitals.deleteVital.useMutation({
    onSuccess: () => {
      toast.success("Vital deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const chartData = vitals
    ?.sort((a, b) => new Date(a.recordDate).getTime() - new Date(b.recordDate).getTime())
    .slice(-10)
    .map((v) => ({
      date: new Date(v.recordDate).toLocaleDateString(),
      systolic: v.systolicBP,
      diastolic: v.diastolicBP,
      heartRate: v.heartRate,
      temperature: v.temperature ? parseFloat(v.temperature.toString()) : null,
    })) || [];

  const getBloodPressureStatus = (systolic?: number, diastolic?: number) => {
    if (!systolic || !diastolic) return "unknown";
    if (systolic < 120 && diastolic < 80) return "normal";
    if (systolic < 130 && diastolic < 80) return "elevated";
    if (systolic < 140 || diastolic < 90) return "stage1";
    return "stage2";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
        return "bg-green-100 text-green-800";
      case "elevated":
        return "bg-yellow-100 text-yellow-800";
      case "stage1":
        return "bg-orange-100 text-orange-800";
      case "stage2":
        return "bg-red-100 text-red-800";
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Vitals Tracking</h1>
          <p className="text-gray-600">Record and monitor patient vital signs</p>
        </div>

        {/* Latest Vital Card */}
        {latestVital && (
          <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Vitals</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {latestVital.systolicBP && latestVital.diastolicBP && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Blood Pressure</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {latestVital.systolicBP}/{latestVital.diastolicBP}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">mmHg</p>
                </div>
              )}
              {latestVital.heartRate && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Heart Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{latestVital.heartRate}</p>
                  <p className="text-xs text-gray-500 mt-1">bpm</p>
                </div>
              )}
              {latestVital.temperature && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Temperature</p>
                  <p className="text-2xl font-bold text-gray-900">{parseFloat(latestVital.temperature.toString()).toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">°F</p>
                </div>
              )}
              {latestVital.weight && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Weight</p>
                  <p className="text-2xl font-bold text-gray-900">{parseFloat(latestVital.weight.toString()).toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">kg</p>
                </div>
              )}
              {latestVital.height && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">Height</p>
                  <p className="text-2xl font-bold text-gray-900">{parseFloat(latestVital.height.toString()).toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">cm</p>
                </div>
              )}
              {latestVital.bmi && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-gray-600 mb-1">BMI</p>
                  <p className="text-2xl font-bold text-gray-900">{parseFloat(latestVital.bmi.toString()).toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">kg/m²</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Vital Signs Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                {chartData.some((d) => d.systolic) && <Line type="monotone" dataKey="systolic" stroke="#3b82f6" name="Systolic BP" />}
                {chartData.some((d) => d.diastolic) && <Line type="monotone" dataKey="diastolic" stroke="#60a5fa" name="Diastolic BP" />}
                {chartData.some((d) => d.heartRate) && <Line type="monotone" dataKey="heartRate" stroke="#ef4444" name="Heart Rate" />}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Add Vital Button */}
        <div className="mb-8">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Record New Vital
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Vital Signs</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  createVitalMutation.mutate({
                    patientId,
                    recordDate: new Date(formData.get("recordDate") as string),
                    systolicBP: formData.get("systolicBP") ? parseInt(formData.get("systolicBP") as string) : undefined,
                    diastolicBP: formData.get("diastolicBP") ? parseInt(formData.get("diastolicBP") as string) : undefined,
                    heartRate: formData.get("heartRate") ? parseInt(formData.get("heartRate") as string) : undefined,
                    temperature: formData.get("temperature") ? parseFloat(formData.get("temperature") as string) : undefined,
                    respiratoryRate: formData.get("respiratoryRate") ? parseInt(formData.get("respiratoryRate") as string) : undefined,
                    weight: formData.get("weight") ? parseFloat(formData.get("weight") as string) : undefined,
                    height: formData.get("height") ? parseFloat(formData.get("height") as string) : undefined,
                    oxygenSaturation: formData.get("oxygenSaturation") ? parseFloat(formData.get("oxygenSaturation") as string) : undefined,
                    notes: (formData.get("notes") as string) || undefined,
                  } as any);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Record Date</label>
                    <Input name="recordDate" type="datetime-local" required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Systolic BP (mmHg)</label>
                    <Input name="systolicBP" type="number" placeholder="120" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Diastolic BP (mmHg)</label>
                    <Input name="diastolicBP" type="number" placeholder="80" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
                    <Input name="heartRate" type="number" placeholder="72" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
                    <Input name="temperature" type="number" step="0.1" placeholder="98.6" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
                    <Input name="respiratoryRate" type="number" placeholder="16" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">O2 Saturation (%)</label>
                    <Input name="oxygenSaturation" type="number" step="0.1" placeholder="98" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <Input name="weight" type="number" step="0.1" placeholder="70" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <Input name="height" type="number" step="0.1" placeholder="170" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <Input name="notes" placeholder="Any additional notes" />
                </div>

                <Button type="submit" className="w-full">
                  Record Vital
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Vitals History */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Vital Signs History</h2>
          {isLoading ? (
            <div className="text-center py-12">Loading vitals...</div>
          ) : vitals && vitals.length > 0 ? (
            <div className="grid gap-4">
              {vitals
                .sort((a, b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime())
                .map((vital) => (
                  <Card key={vital.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-medium text-gray-600">
                            {new Date(vital.recordDate).toLocaleDateString()} {new Date(vital.recordDate).toLocaleTimeString()}
                          </p>
                          {vital.systolicBP && vital.diastolicBP && (
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(getBloodPressureStatus(vital.systolicBP, vital.diastolicBP))}`}>
                              {getBloodPressureStatus(vital.systolicBP, vital.diastolicBP)}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                          {vital.systolicBP && vital.diastolicBP && (
                            <p className="text-gray-700">
                              <span className="font-medium">BP:</span> {vital.systolicBP}/{vital.diastolicBP} mmHg
                            </p>
                          )}
                          {vital.heartRate && (
                            <p className="text-gray-700">
                              <span className="font-medium">HR:</span> {vital.heartRate} bpm
                            </p>
                          )}
                          {vital.temperature && (
                            <p className="text-gray-700">
                              <span className="font-medium">Temp:</span> {parseFloat(vital.temperature.toString()).toFixed(1)}°F
                            </p>
                          )}
                          {vital.weight && (
                            <p className="text-gray-700">
                              <span className="font-medium">Weight:</span> {parseFloat(vital.weight.toString()).toFixed(1)} kg
                            </p>
                          )}
                          {vital.height && (
                            <p className="text-gray-700">
                              <span className="font-medium">Height:</span> {parseFloat(vital.height.toString()).toFixed(1)} cm
                            </p>
                          )}
                          {vital.bmi && (
                            <p className="text-gray-700">
                              <span className="font-medium">BMI:</span> {parseFloat(vital.bmi.toString()).toFixed(1)}
                            </p>
                          )}
                        </div>
                        {vital.notes && <p className="text-sm text-gray-600 mt-2">Notes: {vital.notes}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteVitalMutation.mutate({ id: vital.id })}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No vitals recorded yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
