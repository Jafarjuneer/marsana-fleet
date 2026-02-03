import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Vehicle {
  id: string;
  license_plate: string;
  current_status: string;
  current_branch_id: string;
  mileage: number;
  updated_at: string;
  [key: string]: any;
}

interface UseRealtimeVehiclesOptions {
  branchId?: string;
  enabled?: boolean;
}

export function useRealtimeVehicles(options: UseRealtimeVehiclesOptions = {}) {
  const { branchId, enabled = true } = options;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from("vehicles").select("*");

      if (branchId) {
        query = query.eq("current_branch_id", branchId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setVehicles(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch vehicles"));
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchVehicles();

    // Subscribe to realtime updates
    let channel: RealtimeChannel | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseDelay = 1000; // 1 second

    const subscribe = () => {
      channel = supabase
        .channel("vehicles-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "vehicles",
            filter: branchId ? `current_branch_id=eq.${branchId}` : undefined,
          },
          (payload) => {
            setIsConnected(true);
            reconnectAttempts = 0;

            if (payload.eventType === "DELETE") {
              setVehicles((prev) => prev.filter((v) => v.id !== payload.old.id));
            } else if (payload.eventType === "INSERT") {
              setVehicles((prev) => [...prev, payload.new as Vehicle]);
            } else if (payload.eventType === "UPDATE") {
              setVehicles((prev) =>
                prev.map((v) => (v.id === payload.new.id ? (payload.new as Vehicle) : v))
              );
            }
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
            reconnectAttempts = 0;
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setIsConnected(false);
            attemptReconnect();
          }
        });
    };

    const attemptReconnect = () => {
      if (reconnectAttempts >= maxReconnectAttempts) {
        setError(new Error("Failed to establish realtime connection after multiple attempts"));
        return;
      }

      reconnectAttempts++;
      const delay = baseDelay * Math.pow(2, reconnectAttempts - 1); // Exponential backoff

      reconnectTimeout = setTimeout(() => {
        if (channel) {
          channel.unsubscribe();
        }
        subscribe();
      }, delay);
    };

    subscribe();

    // Cleanup
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [enabled, branchId, fetchVehicles]);

  return {
    vehicles,
    isLoading,
    error,
    isConnected,
    refetch: fetchVehicles,
  };
}
