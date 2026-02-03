import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Play, Pause, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface VehicleLocation {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
}

interface VehicleMapTabProps {
  vehicleId: string;
  locations?: VehicleLocation[];
  isLoading?: boolean;
}

export function VehicleMapTab({ vehicleId, locations = [], isLoading = false }: VehicleMapTabProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);

  // Initialize map (placeholder for Mapbox)
  useEffect(() => {
    if (!mapContainer.current) return;

    // Placeholder: In production, initialize Mapbox here
    // For now, show a simple message
    mapContainer.current.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; border-radius: 8px;">
        <div style="text-align: center;">
          <p style="color: #666; margin: 0 0 10px 0;">Map integration requires Mapbox API key</p>
          <p style="color: #999; font-size: 14px; margin: 0;">Configure VITE_MAPBOX_ACCESS_TOKEN in environment variables</p>
        </div>
      </div>
    `;
  }, []);

  // Handle playback
  useEffect(() => {
    if (!isPlaying || locations.length === 0) return;

    const interval = setInterval(() => {
      setCurrentLocationIndex((prev) => {
        if (prev >= locations.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, locations.length, playbackSpeed]);

  const filteredLocations = locations.filter((loc) => {
    const locDate = new Date(loc.timestamp).toISOString().split("T")[0];
    return locDate >= dateRange.start && locDate <= dateRange.end;
  });

  const currentLocation = filteredLocations[currentLocationIndex];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Location</CardTitle>
          <CardDescription>Current location and route history</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Map Container */}
          <div
            ref={mapContainer}
            className="w-full h-96 rounded-lg border border-gray-200 overflow-hidden"
          />

          {/* Current Location Info */}
          {currentLocation && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Current Location</p>
              <p className="text-sm text-gray-600">
                Lat: {currentLocation.latitude.toFixed(4)}, Lon: {currentLocation.longitude.toFixed(4)}
              </p>
              <p className="text-sm text-gray-600">Speed: {currentLocation.speed} km/h</p>
              <p className="text-sm text-gray-600">
                Time: {new Date(currentLocation.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Route Playback</CardTitle>
          <CardDescription>Replay vehicle movement over time</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isPlaying ? "default" : "outline"}
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={filteredLocations.length === 0}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Play
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsPlaying(false);
                setCurrentLocationIndex(0);
              }}
              disabled={filteredLocations.length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <div className="flex-1" />

            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
            </select>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>
                {currentLocationIndex + 1} / {filteredLocations.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${filteredLocations.length > 0 ? ((currentLocationIndex + 1) / filteredLocations.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {filteredLocations.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No location data available for the selected date range
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
