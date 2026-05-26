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
import { Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function Documents() {
  const { patientId } = useParams<{ patientId: string }>();
  const pid = parseInt(patientId || "0");
  const [showDialog, setShowDialog] = useState(false);

  const { data: documents = [] } = trpc.documents.getDocuments.useQuery({ patientId: pid });
  const createDocument = trpc.documents.createDocument.useMutation({
    onSuccess: () => {
      toast.success("Document created successfully");
      setShowDialog(false);
      trpc.useUtils().documents.getDocuments.invalidate();
    },
    onError: () => toast.error("Failed to create document"),
  });

  const deleteDocument = trpc.documents.deleteDocument.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      trpc.useUtils().documents.getDocuments.invalidate();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "final": return "bg-green-100 text-green-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Documents & Reports</h1>
        <p className="text-gray-600 mt-2">Manage clinical documents, reports, and medical records</p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Clinical Documents</h2>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Document</DialogTitle>
            </DialogHeader>
            <DocumentForm
              patientId={pid}
              onSubmit={(data: any) => createDocument.mutate(data)}
              onSuccess={() => setShowDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {documents.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No documents yet. Create one to get started.
            </CardContent>
          </Card>
        ) : (
          documents.map((doc: any) => (
            <Card key={doc.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-indigo-600 mt-1" />
                    <div>
                      <CardTitle className="text-lg">{doc.title}</CardTitle>
                      <CardDescription>
                        {doc.documentType} • {new Date(doc.documentDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {doc.provider && <p className="text-sm"><strong>Provider:</strong> {doc.provider}</p>}
                {doc.content && <p className="text-sm"><strong>Content:</strong> {doc.content.substring(0, 100)}...</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="destructive" size="sm" onClick={() => deleteDocument.mutate({ id: doc.id })}>
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

function DocumentForm({ patientId, onSubmit, onSuccess }: any) {
  const [formData, setFormData] = useState({
    patientId,
    documentType: "",
    title: "",
    content: "",
    documentDate: new Date().toISOString().split("T")[0],
    status: "draft" as const,
    provider: "",
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Document Type</Label>
        <Input
          value={formData.documentType}
          onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
          placeholder="e.g., Lab Report, Discharge Summary"
        />
      </div>
      <div>
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Document title"
        />
      </div>
      <div>
        <Label>Document Date</Label>
        <Input
          type="date"
          value={formData.documentDate}
          onChange={(e) => setFormData({ ...formData, documentDate: e.target.value })}
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
        <Label>Content</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="Document content"
          rows={4}
        />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as any })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="final">Final</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() => {
          onSubmit({ ...formData, documentDate: new Date(formData.documentDate) });
          onSuccess();
        }}
        className="w-full"
      >
        Create Document
      </Button>
    </div>
  );
}
