import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2, AlertCircle, Wrench } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const resultColors: Record<string, string> = {
  CLEAN: "bg-green-100 text-green-800",
  DAMAGE: "bg-red-100 text-red-800",
  SERVICE_DUE: "bg-yellow-100 text-yellow-800",
};

export default function Inspections() {
  const { user } = useAuth();
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: inspectionsData, isLoading } = trpc.inspections.list.useQuery({
    limit,
    offset,
  });

  const inspections = inspectionsData?.inspections || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inspections</h1>
          <p className="text-muted-foreground">Vehicle condition and maintenance checks</p>
        </div>
        {["super_admin", "hq", "branch_admin", "tech", "driver"].includes(user?.role || "") && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Inspection
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">Loading inspections...</p>
            </CardContent>
          </Card>
        ) : inspections.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-muted-foreground text-center">No inspections found</p>
            </CardContent>
          </Card>
        ) : (
          inspections.map((inspection: any) => (
            <Card key={inspection.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Inspection #{inspection.id.slice(0, 8)}</h3>
                      <Badge className={resultColors[inspection.result] || ""}>
                        {inspection.result}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Vehicle: {inspection.vehicle_id}
                    </p>
                    {inspection.mileage && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Mileage: {inspection.mileage} km
                      </p>
                    )}
                    {inspection.notes && (
                      <p className="text-sm mb-2">
                        <span className="font-medium">Notes:</span> {inspection.notes}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(inspection.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    {inspection.result === "DAMAGE" && (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    {inspection.result === "SERVICE_DUE" && (
                      <Wrench className="h-5 w-5 text-yellow-600" />
                    )}
                    {inspection.result === "CLEAN" && (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
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
