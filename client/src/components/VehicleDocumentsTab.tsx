import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Upload, Download, Trash2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Document {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

interface VehicleDocumentsTabProps {
  vehicleId: string;
  documents?: Document[];
  onDocumentsChange?: () => void;
}

export function VehicleDocumentsTab({
  vehicleId,
  documents = [],
  onDocumentsChange,
}: VehicleDocumentsTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Generate file path: {bucket}/{year}/{month}/{entity}/{uuid}_{filename}
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const uuid = crypto.randomUUID();
      const filePath = `vehicle-docs/${year}/${month}/vehicles/${uuid}_${file.name}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("vehicle-docs")
        .upload(filePath, file);

      if (uploadError) {
        toast.error("Upload failed: " + uploadError.message);
        return;
      }

      // Save document metadata to database
      const { error: dbError } = await supabase
        .from("vehicle_documents")
        .insert([
          {
            vehicle_id: vehicleId,
            filename: file.name,
            file_path: filePath,
            file_size: file.size,
          } as any,
        ]);

      if (dbError) {
        toast.error("Failed to save document metadata");
        return;
      }

      toast.success("Document uploaded successfully");
      onDocumentsChange?.();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("An error occurred during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      // Generate signed URL
      const { data, error } = await supabase.storage
        .from("vehicle-docs")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) {
        toast.error("Failed to generate download link");
        return;
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDelete = async (docId: string, filePath: string) => {
    setIsDeleting(true);
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("vehicle-docs")
        .remove([filePath]);

      if (storageError) {
        toast.error("Failed to delete file");
        return;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("vehicle_documents")
        .delete()
        .eq("id", docId);

      if (dbError) {
        toast.error("Failed to delete document record");
        return;
      }

      toast.success("Document deleted successfully");
      onDocumentsChange?.();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete document");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Add vehicle registration, insurance, or maintenance documents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Choose File
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              Max 50MB. Supported: PDF, JPG, PNG, DOC
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {documents.length === 0
              ? "No documents uploaded yet"
              : `${documents.length} document${documents.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No documents uploaded yet. Upload your first document above.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.file_size / 1024).toFixed(1)} KB •{" "}
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(doc.file_path, doc.filename)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const doc = documents.find((d) => d.id === deleteConfirm);
                if (doc) {
                  handleDelete(doc.id, doc.file_path);
                }
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
