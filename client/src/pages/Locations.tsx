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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Locations() {
  const [, navigate] = useLocation();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const utils = trpc.useUtils();

  const { data: locations, isLoading } = trpc.locations.list.useQuery({ includeInactive: true });

  const createMutation = trpc.locations.create.useMutation({
    onSuccess: () => {
      toast.success("Location added");
      setShowAddDialog(false);
      utils.locations.list.invalidate();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const updateMutation = trpc.locations.update.useMutation({
    onSuccess: () => utils.locations.list.invalidate(),
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const deleteMutation = trpc.locations.delete.useMutation({
    onSuccess: () => {
      toast.success("Location removed");
      utils.locations.list.invalidate();
    },
    onError: (error) => toast.error(`Error: ${error.message}`),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    createMutation.mutate({
      name: fd.get("name") as string,
      address: (fd.get("address") as string) || undefined,
      status: "active",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="ghost" onClick={() => navigate("/staff")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Staff
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Locations</h1>
          <p className="text-gray-600">Clinics and sites used for staff schedules</p>
        </div>

        <div className="mb-8">
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Location</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input name="name" required placeholder="e.g., Downtown Clinic" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input name="address" placeholder="Optional" />
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  Add Location
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Loading locations...</div>
        ) : locations && locations.length > 0 ? (
          <div className="grid gap-4">
            {locations.map((loc) => (
              <Card key={loc.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{loc.name}</h3>
                        {loc.status === "inactive" && (
                          <Badge className="bg-gray-200 text-gray-700">Inactive</Badge>
                        )}
                      </div>
                      {loc.address && <p className="text-sm text-gray-600">{loc.address}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        updateMutation.mutate({
                          id: loc.id,
                          status: loc.status === "active" ? "inactive" : "active",
                        })
                      }
                    >
                      {loc.status === "active" ? "Deactivate" : "Reactivate"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Remove ${loc.name}?`)) {
                          deleteMutation.mutate({ id: loc.id });
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
          <div className="text-center py-12 text-gray-500">No locations yet</div>
        )}
      </div>
    </div>
  );
}
