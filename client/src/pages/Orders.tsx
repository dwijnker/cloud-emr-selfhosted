import { useState } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";

export default function Orders() {
  const { patientId } = useParams<{ patientId: string }>();
  const pid = parseInt(patientId || "0");

  const [activeTab, setActiveTab] = useState("lab");
  const [showLabDialog, setShowLabDialog] = useState(false);
  const [showImagingDialog, setShowImagingDialog] = useState(false);
  const [showCardiacDialog, setShowCardiacDialog] = useState(false);

  // Lab Orders
  const { data: labOrders = [] } = trpc.orders.getLabOrders.useQuery({ patientId: pid });
  const createLabOrder = trpc.orders.createLabOrder.useMutation({
    onSuccess: () => {
      toast.success("Lab order created successfully");
      setShowLabDialog(false);
      trpc.useUtils().orders.getLabOrders.invalidate();
    },
    onError: () => toast.error("Failed to create lab order"),
  });

  const deleteLabOrder = trpc.orders.deleteLabOrder.useMutation({
    onSuccess: () => {
      toast.success("Lab order deleted");
      trpc.useUtils().orders.getLabOrders.invalidate();
    },
  });

  // Imaging Orders
  const { data: imagingOrders = [] } = trpc.orders.getImagingOrders.useQuery({ patientId: pid });
  const createImagingOrder = trpc.orders.createImagingOrder.useMutation({
    onSuccess: () => {
      toast.success("Imaging order created successfully");
      setShowImagingDialog(false);
      trpc.useUtils().orders.getImagingOrders.invalidate();
    },
    onError: () => toast.error("Failed to create imaging order"),
  });

  const deleteImagingOrder = trpc.orders.deleteImagingOrder.useMutation({
    onSuccess: () => {
      toast.success("Imaging order deleted");
      trpc.useUtils().orders.getImagingOrders.invalidate();
    },
  });

  // Cardiac Orders
  const { data: cardiacOrders = [] } = trpc.orders.getCardiacOrders.useQuery({ patientId: pid });
  const createCardiacOrder = trpc.orders.createCardiacOrder.useMutation({
    onSuccess: () => {
      toast.success("Cardiac order created successfully");
      setShowCardiacDialog(false);
      trpc.useUtils().orders.getCardiacOrders.invalidate();
    },
    onError: () => toast.error("Failed to create cardiac order"),
  });

  const deleteCardiacOrder = trpc.orders.deleteCardiacOrder.useMutation({
    onSuccess: () => {
      toast.success("Cardiac order deleted");
      trpc.useUtils().orders.getCardiacOrders.invalidate();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
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
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-600 mt-2">Manage lab, imaging, and cardiac orders</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lab">Lab Orders</TabsTrigger>
          <TabsTrigger value="imaging">Imaging Orders</TabsTrigger>
          <TabsTrigger value="cardiac">Cardiac Orders</TabsTrigger>
        </TabsList>

        {/* Lab Orders Tab */}
        <TabsContent value="lab" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Lab Orders</h2>
            <Dialog open={showLabDialog} onOpenChange={setShowLabDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Lab Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Lab Order</DialogTitle>
                </DialogHeader>
                <LabOrderForm
                  patientId={pid}
                  onSubmit={(data: any) => createLabOrder.mutate(data)}
                  onSuccess={() => setShowLabDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {labOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No lab orders yet. Create one to get started.
                </CardContent>
              </Card>
            ) : (
              labOrders.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.provider || "Lab Order"}</CardTitle>
                        <CardDescription>
                          Ordered: {new Date(order.orderDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.labVendor && <p className="text-sm"><strong>Vendor:</strong> {order.labVendor}</p>}
                    {order.notes && <p className="text-sm"><strong>Notes:</strong> {order.notes}</p>}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteLabOrder.mutate({ id: order.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Imaging Orders Tab */}
        <TabsContent value="imaging" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Imaging Orders</h2>
            <Dialog open={showImagingDialog} onOpenChange={setShowImagingDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Imaging Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Imaging Order</DialogTitle>
                </DialogHeader>
                <ImagingOrderForm
                  patientId={pid}
                  onSubmit={(data: any) => createImagingOrder.mutate(data)}
                  onSuccess={() => setShowImagingDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {imagingOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No imaging orders yet. Create one to get started.
                </CardContent>
              </Card>
            ) : (
              imagingOrders.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.imagingType || "Imaging Order"}</CardTitle>
                        <CardDescription>
                          Ordered: {new Date(order.orderDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.facility && <p className="text-sm"><strong>Facility:</strong> {order.facility}</p>}
                    {order.notes && <p className="text-sm"><strong>Notes:</strong> {order.notes}</p>}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteImagingOrder.mutate({ id: order.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Cardiac Orders Tab */}
        <TabsContent value="cardiac" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Cardiac Orders</h2>
            <Dialog open={showCardiacDialog} onOpenChange={setShowCardiacDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Cardiac Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Cardiac Order</DialogTitle>
                </DialogHeader>
                <CardiacOrderForm
                  patientId={pid}
                  onSubmit={(data: any) => createCardiacOrder.mutate(data)}
                  onSuccess={() => setShowCardiacDialog(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {cardiacOrders.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No cardiac orders yet. Create one to get started.
                </CardContent>
              </Card>
            ) : (
              cardiacOrders.map((order: any) => (
                <Card key={order.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{order.testType || "Cardiac Order"}</CardTitle>
                        <CardDescription>
                          Ordered: {new Date(order.orderDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {order.facility && <p className="text-sm"><strong>Facility:</strong> {order.facility}</p>}
                    {order.notes && <p className="text-sm"><strong>Notes:</strong> {order.notes}</p>}
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCardiacOrder.mutate({ id: order.id })}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LabOrderForm({ patientId, onSubmit, onSuccess }: any) {
  const [formData, setFormData] = useState({
    patientId,
    orderDate: new Date().toISOString().split("T")[0],
    status: "pending" as const,
    provider: "",
    labVendor: "",
    notes: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Order Date</Label>
        <Input
          type="date"
          value={formData.orderDate}
          onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
        />
      </div>
      <div>
        <Label>Provider</Label>
        <Input
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          placeholder="Provider name"
        />
      </div>
      <div>
        <Label>Lab Vendor</Label>
        <Input
          value={formData.labVendor}
          onChange={(e) => setFormData({ ...formData, labVendor: e.target.value })}
          placeholder="Lab vendor name"
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
        />
      </div>
      <Button
        onClick={() => {
          onSubmit({ ...formData, orderDate: new Date(formData.orderDate) });
          onSuccess();
        }}
        className="w-full"
      >
        Create Lab Order
      </Button>
    </div>
  );
}

function ImagingOrderForm({ patientId, onSubmit, onSuccess }: any) {
  const [formData, setFormData] = useState({
    patientId,
    orderDate: new Date().toISOString().split("T")[0],
    status: "pending" as const,
    imagingType: "",
    facility: "",
    notes: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Order Date</Label>
        <Input
          type="date"
          value={formData.orderDate}
          onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
        />
      </div>
      <div>
        <Label>Imaging Type</Label>
        <Input
          value={formData.imagingType}
          onChange={(e) => setFormData({ ...formData, imagingType: e.target.value })}
          placeholder="e.g., X-Ray, CT, MRI"
        />
      </div>
      <div>
        <Label>Facility</Label>
        <Input
          value={formData.facility}
          onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
          placeholder="Imaging facility name"
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
        />
      </div>
      <Button
        onClick={() => {
          onSubmit({ ...formData, orderDate: new Date(formData.orderDate) });
          onSuccess();
        }}
        className="w-full"
      >
        Create Imaging Order
      </Button>
    </div>
  );
}

function CardiacOrderForm({ patientId, onSubmit, onSuccess }: any) {
  const [formData, setFormData] = useState({
    patientId,
    orderDate: new Date().toISOString().split("T")[0],
    status: "pending" as const,
    testType: "",
    facility: "",
    notes: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Order Date</Label>
        <Input
          type="date"
          value={formData.orderDate}
          onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
        />
      </div>
      <div>
        <Label>Test Type</Label>
        <Input
          value={formData.testType}
          onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
          placeholder="e.g., ECG, Echocardiogram, Stress Test"
        />
      </div>
      <div>
        <Label>Facility</Label>
        <Input
          value={formData.facility}
          onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
          placeholder="Cardiac center name"
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
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Notes</Label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
        />
      </div>
      <Button
        onClick={() => {
          onSubmit({ ...formData, orderDate: new Date(formData.orderDate) });
          onSuccess();
        }}
        className="w-full"
      >
        Create Cardiac Order
      </Button>
    </div>
  );
}
