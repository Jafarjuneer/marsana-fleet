import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertCircle, Truck, Clock, CheckCircle2 } from "lucide-react";

const COLORS = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981"];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: vehicles } = trpc.vehicles.list.useQuery({ limit: 1000 });
  const { data: alerts } = trpc.alerts.list.useQuery({ limit: 100 });
  const { data: handshakes } = trpc.handshakes.list.useQuery({ limit: 100 });

  if (!user) return null;

  const vehicleStats = {
    total: vehicles?.vehicles.length || 0,
    available: vehicles?.vehicles.filter((v: any) => v.current_status === "AVAILABLE").length || 0,
    onRent: vehicles?.vehicles.filter((v: any) => v.current_status === "ON_RENT").length || 0,
    maintenance: vehicles?.vehicles.filter((v: any) => v.current_status === "MAINTENANCE").length || 0,
    accident: vehicles?.vehicles.filter((v: any) => v.current_status === "ACCIDENT").length || 0,
  };

  const statusData = [
    { name: "Available", value: vehicleStats.available },
    { name: "On Rent", value: vehicleStats.onRent },
    { name: "Maintenance", value: vehicleStats.maintenance },
    { name: "Accident", value: vehicleStats.accident },
  ];

  const criticalAlerts = alerts?.alerts.filter((a: any) => a.severity === "CRITICAL") || [];
  const pendingHandshakes = handshakes?.handshakes.filter((h: any) => h.status === "PENDING") || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleStats.total}</div>
            <p className="text-xs text-muted-foreground">Fleet size</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicleStats.available}</div>
            <p className="text-xs text-muted-foreground">Ready to rent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Handshakes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingHandshakes.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Status Distribution</CardTitle>
            <CardDescription>Current fleet status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Critical Alerts</CardTitle>
            <CardDescription>Recent critical issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {criticalAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No critical alerts</p>
              ) : (
                criticalAlerts.slice(0, 5).map((alert: any) => (
                  <div key={alert.id} className="flex items-start space-x-3 border-l-2 border-red-500 pl-3">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.type}</p>
                      <p className="text-xs text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Handshakes</CardTitle>
          <CardDescription>Vehicle transfers awaiting acceptance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingHandshakes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending handshakes</p>
            ) : (
              pendingHandshakes.slice(0, 5).map((handshake: any) => (
                <div key={handshake.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{handshake.handshake_ref}</p>
                    <p className="text-xs text-muted-foreground">
                      From branch to destination • ETA: {handshake.eta ? new Date(handshake.eta).toLocaleDateString() : "Not set"}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
