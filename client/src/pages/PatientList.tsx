import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { Plus, Search, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";

export default function PatientList() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch patients
  const { data: patients, isLoading, error } = trpc.patients.list.useQuery({
    limit: 100,
    offset: 0,
  });

  // Filter patients based on search
  const filteredPatients = patients?.filter((p) => {
    const searchLower = debouncedSearch.toLowerCase();
    return (
      p.firstName.toLowerCase().includes(searchLower) ||
      p.lastName.toLowerCase().includes(searchLower) ||
      (p.email?.toLowerCase().includes(searchLower) ?? false) ||
      (p.mrn?.includes(searchLower) ?? false)
    );
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Patients</h1>
          <p className="text-muted-foreground">Manage and view patient records</p>
        </div>
        <Button
          onClick={() => navigate("/patients/new")}
          className="btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Patient
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search by name, MRN, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="card-base border border-red-200 bg-red-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <div>
              <p className="font-semibold text-red-900">Error loading patients</p>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="card-base text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading patients...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPatients.length === 0 && (
        <div className="card-base text-center py-12">
          <p className="text-muted-foreground mb-4">
            {debouncedSearch ? "No patients found matching your search" : "No patients yet"}
          </p>
          {!debouncedSearch && (
            <Button
              onClick={() => navigate("/patients/new")}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Patient
            </Button>
          )}
        </div>
      )}

      {/* Patient List */}
      {!isLoading && filteredPatients.length > 0 && (
        <div className="card-base overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>MRN</th>
                  <th>DOB</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="font-medium text-foreground">
                      {patient.firstName} {patient.lastName}
                    </td>
                    <td className="text-muted-foreground">{patient.mrn || "—"}</td>
                    <td className="text-muted-foreground">
                      {patient.dateOfBirth
                        ? format(new Date(patient.dateOfBirth), "MMM d, yyyy")
                        : "—"}
                    </td>
                    <td className="text-muted-foreground text-sm">{patient.email || "—"}</td>
                    <td className="text-muted-foreground text-sm">{patient.phone || "—"}</td>
                    <td>
                      <span className={`badge-${patient.status === "active" ? "success" : "warning"}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        className="text-primary hover:text-primary/80"
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Results Count */}
          <div className="px-6 py-3 border-t border-border bg-muted/50 text-sm text-muted-foreground">
            Showing {filteredPatients.length} of {patients?.length || 0} patients
          </div>
        </div>
      )}
    </div>
  );
}
