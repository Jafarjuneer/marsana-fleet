import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Edit2, AlertCircle, FileText, Wrench, Map, History } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ON_RENT: "bg-blue-100 text-blue-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  PENDING_INSPECTION: "bg-yellow-100 text-yellow-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  ACCIDENT: "bg-red-100 text-red-800",
};

export default function VehicleDetails() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [vehicleId] = useState(() => {
    // Get vehicle ID from URL
    const match = window.location.pathname.match(/\/vehicles\/([^/]+)/);
    return match ? match[1] : null;
  });

  const { data: vehicle, isLoading } = trpc.vehicles.getById.useQuery(vehicleId || "", {
    enabled: !!vehicleId,
  });

  if (!vehicleId) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Vehicle not found</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading vehicle details...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Vehicle not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vehicles")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{vehicle.plate_no}</h1>
            <p className="text-muted-foreground">
              {vehicle.make} {vehicle.model} ({vehicle.year})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusColors[vehicle.current_status] || ""}>
            {vehicle.current_status}
          </Badge>
          {["super_admin", "hq", "branch_admin"].includes(user?.role || "") && (
            <Button className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">VIN</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-mono">{vehicle.vin}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mileage</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{vehicle.mileage} km</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {new Date(vehicle.updated_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="service" className="gap-2">
            <Wrench className="h-4 w-4" />
            Service
          </TabsTrigger>
          <TabsTrigger value="telemetry" className="gap-2">
            <Map className="h-4 w-4" />
            Telemetry
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Make</p>
                  <p className="font-medium">{vehicle.make}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-medium">{vehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year</p>
                  <p className="font-medium">{vehicle.year}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plate Number</p>
                  <p className="font-medium">{vehicle.plate_no}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VIN</p>
                  <p className="font-mono text-sm">{vehicle.vin}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Mileage</p>
                  <p className="font-medium">{vehicle.mileage} km</p>
                </div>
              </div>

              {["super_admin", "hq", "branch_admin"].includes(user?.role || "") && (
                <Button className="w-full mt-4">Change Status</Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
              <CardDescription>Vehicle registration and maintenance documents</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No documents uploaded yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="service">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>Maintenance tickets and service records</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No service records found</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telemetry">
          <Card>
            <CardHeader>
              <CardTitle>Telemetry</CardTitle>
              <CardDescription>GPS tracking and vehicle diagnostics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No telemetry data available</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Movement History</CardTitle>
              <CardDescription>Handshake and transfer timeline</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No movement history found</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
