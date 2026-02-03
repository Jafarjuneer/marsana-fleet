import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function Handshakes() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | undefined>();
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: handshakesData, isLoading, refetch } = trpc.handshakes.list.useQuery({
    status: status as any,
    limit,
    offset,
  });

  const acceptHandshakeMutation = trpc.handshakes.accept.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const completeHandshakeMutation = trpc.handshakes.complete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handshakes = handshakesData?.handshakes || [];

  const handleAccept = async (handshakeId: string) => {
    try {
      await acceptHandshakeMutation.mutateAsync({ handshake_id: handshakeId });
    } catch (error) {
      console.error("Error accepting handshake:", error);
    }
  };

  const handleComplete = async (handshakeId: string) => {
    try {
      await completeHandshakeMutation.mutateAsync({ handshake_id: handshakeId });
    } catch (error) {
      console.error("Error completing handshake:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Handshakes</h1>
          <p className="text-muted-foreground">Manage vehicle transfers between branches</p>
        </div>
        {["super_admin", "hq", "branch_admin"].includes(user?.role || "") && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Handshake
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={status || ""}
            onChange={(e) => setStatus(e.target.value || undefined)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">Loading handshakes...</p>
            </CardContent>
          </Card>
        ) : handshakes.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">No handshakes found</p>
            </CardContent>
          </Card>
        ) : (
          handshakes.map((handshake: any) => (
            <Card key={handshake.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{handshake.handshake_ref}</h3>
                      <Badge className={statusColors[handshake.status] || ""}>
                        {handshake.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Vehicle transfer from branch to destination
                    </p>
                    {handshake.notes && (
                      <p className="text-sm mb-3">
                        <span className="font-medium">Notes:</span> {handshake.notes}
                      </p>
                    )}
                    {handshake.eta && (
                      <p className="text-sm text-muted-foreground">
                        ETA: {new Date(handshake.eta).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {handshake.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(handshake.id)}
                          disabled={acceptHandshakeMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {handshake.status === "ACCEPTED" && (
                      <Button
                        size="sm"
                        onClick={() => handleComplete(handshake.id)}
                        disabled={completeHandshakeMutation.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
