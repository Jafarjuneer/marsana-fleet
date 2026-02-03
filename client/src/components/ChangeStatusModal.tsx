import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

const stateTransitions: Record<string, string[]> = {
  AVAILABLE: ["ON_RENT", "IN_TRANSIT", "MAINTENANCE", "ACCIDENT"],
  ON_RENT: ["PENDING_INSPECTION"],
  IN_TRANSIT: ["PENDING_INSPECTION"],
  PENDING_INSPECTION: ["AVAILABLE", "MAINTENANCE", "ACCIDENT"],
  MAINTENANCE: ["AVAILABLE"],
  ACCIDENT: ["MAINTENANCE"],
};

interface ChangeStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  currentStatus: string;
  onStatusChanged?: () => void;
}

export function ChangeStatusModal({
  open,
  onOpenChange,
  vehicleId,
  currentStatus,
  onStatusChanged,
}: ChangeStatusModalProps) {
  const [newStatus, setNewStatus] = useState("");
  const [reason, setReason] = useState("");
  const [mileage, setMileage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const updateStatusMutation = trpc.vehicles.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Vehicle status updated successfully");
      onOpenChange(false);
      onStatusChanged?.();
      // Reset form
      setNewStatus("");
      setReason("");
      setMileage("");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update vehicle status");
    },
  });

  const allowedTransitions = stateTransitions[currentStatus] || [];
  const requiresReason = ["ACCIDENT", "MAINTENANCE"].includes(newStatus);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStatus) {
      toast.error("Please select a new status");
      return;
    }

    if (requiresReason && !reason.trim()) {
      toast.error("Please provide a reason for this status change");
      return;
    }

    setIsLoading(true);

    try {
      await updateStatusMutation.mutateAsync({
        vehicleId,
        newStatus: newStatus as any,
        reason: reason || undefined,
        mileage: mileage ? parseInt(mileage) : undefined,
      });
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Vehicle Status</DialogTitle>
          <DialogDescription>
            Current status: <span className="font-semibold">{currentStatus}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-status">New Status</Label>
            <select
              id="new-status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select new status</option>
              {allowedTransitions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Describe the reason for this status change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-24"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="mileage">Mileage (km) - Optional</Label>
            <Input
              id="mileage"
              type="number"
              placeholder="Current mileage"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
            />
          </div>

          {!allowedTransitions.includes(newStatus) && newStatus && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">
                Cannot transition from {currentStatus} to {newStatus}
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !newStatus || (requiresReason && !reason.trim())}
            >
              {isLoading ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
