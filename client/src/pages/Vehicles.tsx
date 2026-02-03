import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Truck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ON_RENT: "bg-blue-100 text-blue-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  ACCIDENT: "bg-red-100 text-red-800",
};

export default function Vehicles() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string | undefined>();
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const { data: vehiclesData, isLoading } = trpc.vehicles.list.useQuery({
    status: status as any,
    limit,
    offset,
  });

  const vehicles = vehiclesData?.vehicles || [];
  const filtered = vehicles.filter((v: any) =>
    v.plate_no.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vehicles</h1>
          <p className="text-muted-foreground">Manage your fleet</p>
        </div>
        {["super_admin", "hq", "branch_admin"].includes(user?.role || "") && (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by plate number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              value={status || ""}
              onChange={(e) => setStatus(e.target.value || undefined)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_RENT">On Rent</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="PENDING_INSPECTION">Pending Inspection</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="ACCIDENT">Accident</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fleet ({filtered.length})</CardTitle>
          <CardDescription>All vehicles in your fleet</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading vehicles...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">No vehicles found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((vehicle: any) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition"
                >
                  <div className="flex items-center gap-4">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{vehicle.plate_no}</p>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.make} {vehicle.model} ({vehicle.year})
                      </p>
                      <p className="text-xs text-muted-foreground">VIN: {vehicle.vin}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Mileage</p>
                      <p className="font-medium">{vehicle.mileage} km</p>
                    </div>
                    <Badge className={statusColors[vehicle.current_status] || ""}>
                      {vehicle.current_status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
