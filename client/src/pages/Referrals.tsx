import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

export default function Referrals() {
  const { patientId } = useParams<{ patientId: string }>();
  const pid = parseInt(patientId || "0");

  const [showDialog, setShowDialog] = useState(false);

  // Referrals
  const { data: referrals = [] } = trpc.referrals.getReferrals.useQuery({ patientId: pid });
  const createReferral = trpc.referrals.createReferral.useMutation({
    onSuccess: () => {
      toast.success("Referral created successfully");
      setShowDialog(false);
      trpc.useUtils().referrals.getReferrals.invalidate();
    },
    onError: () => toast.error("Failed to create referral"),
  });

  const updateReferral = trpc.referrals.updateReferral.useMutation({
    onSuccess: () => {
      toast.success("Referral updated");
      trpc.useUtils().referrals.getReferrals.invalidate();
    },
  });

  const deleteReferral = trpc.referrals.deleteReferral.useMutation({
    onSuccess: () => {
      toast.success("Referral deleted");
      trpc.useUtils().referrals.getReferrals.invalidate();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Referrals Management</h1>
        <p className="text-gray-600 mt-2">Create and manage patient referrals to specialists</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Active Referrals</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Referral
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Referral</DialogTitle>
            </DialogHeader>
            <ReferralForm
              patientId={pid}
              onSubmit={(data: any) => createReferral.mutate(data)}
              onSuccess={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {referrals.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No referrals yet. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          referrals.map((referral: any) => (
            <Card key={referral.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Send className="w-5 h-5 text-indigo-600 mt-1" />
                    <div>
                      <CardTitle className="text-lg">{referral.specialty}</CardTitle>
                      <CardDescription>
                        Referred to: {referral.referredTo} • {new Date(referral.referralDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(referral.status)}>{referral.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {referral.referringProvider && (
                  <p className="text-sm"><strong>Referring Provider:</strong> {referral.referringProvider}</p>
                )}
                {referral.reason && <p className="text-sm"><strong>Reason:</strong> {referral.reason}</p>}
                {referral.notes && <p className="text-sm"><strong>Notes:</strong> {referral.notes}</p>}
                <div className="flex gap-2 pt-2">
                  <Select
                    value={referral.status}
                    onValueChange={(value) =>
                      updateReferral.mutate({ id: referral.id, status: value as any })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteReferral.mutate({ id: referral.id })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function ReferralForm({ patientId, onSubmit, onSuccess }: any) {
  const [formData, setFormData] = useState({
    patientId,
    specialty: "",
    referralDate: new Date().toISOString().split("T")[0],
    status: "pending" as const,
    referringProvider: "",
    referredTo: "",
    reason: "",
    notes: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Specialty</Label>
        <Input
          value={formData.specialty}
          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          placeholder="e.g., Cardiology, Neurology"
        />
      </div>
      <div>
        <Label>Referred To</Label>
        <Input
          value={formData.referredTo}
          onChange={(e) => setFormData({ ...formData, referredTo: e.target.value })}
          placeholder="Provider or facility name"
        />
      </div>
      <div>
        <Label>Referral Date</Label>
        <Input
          type="date"
          value={formData.referralDate}
          onChange={(e) => setFormData({ ...formData, referralDate: e.target.value })}
        />
      </div>
      <div>
        <Label>Referring Provider</Label>
        <Input
          value={formData.referringProvider}
          onChange={(e) => setFormData({ ...formData, referringProvider: e.target.value })}
          placeholder="Your name"
        />
      </div>
      <div>
        <Label>Reason for Referral</Label>
        <Textarea
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          placeholder="Clinical reason for referral"
          rows={3}
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Additional Notes</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional information"
          rows={2}
        />
      </div>
      <Button
        onClick={() => {
          onSubmit({ ...formData, referralDate: new Date(formData.referralDate) });
          onSuccess();
        }}
        className="w-full"
      >
        Create Referral
      </Button>
    </div>
  );
}
