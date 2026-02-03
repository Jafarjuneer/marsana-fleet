import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Alert {
  id: string;
  vehicle_id: string;
  alert_type: string;
  status: string;
  description: string;
  created_at: string;
  resolved_at?: string;
  [key: string]: any;
}

interface UseRealtimeAlertsOptions {
  vehicleId?: string;
  status?: string;
  enabled?: boolean;
}

export function useRealtimeAlerts(options: UseRealtimeAlertsOptions = {}) {
  const { vehicleId, status, enabled = true } = options;
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from("alerts").select("*");

      if (vehicleId) {
        query = query.eq("vehicle_id", vehicleId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error: fetchError } = await query.order("created_at", {
        ascending: false,
      });

      if (fetchError) throw fetchError;
      setAlerts(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch alerts"));
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId, status]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchAlerts();

    // Subscribe to realtime updates
    let channel: RealtimeChannel | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseDelay = 1000;

    const subscribe = () => {
      const filters: string[] = [];

      if (vehicleId) {
        filters.push(`vehicle_id=eq.${vehicleId}`);
      }

      if (status) {
        filters.push(`status=eq.${status}`);
      }

      const filter = filters.length > 0 ? filters.join(",") : undefined;

      channel = supabase
        .channel("alerts-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "alerts",
            filter,
          },
          (payload) => {
            setIsConnected(true);
            reconnectAttempts = 0;

            if (payload.eventType === "DELETE") {
              setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
            } else if (payload.eventType === "INSERT") {
              setAlerts((prev) => [payload.new as Alert, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setAlerts((prev) =>
                prev.map((a) => (a.id === payload.new.id ? (payload.new as Alert) : a))
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
      const delay = baseDelay * Math.pow(2, reconnectAttempts - 1);

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
  }, [enabled, vehicleId, status, fetchAlerts]);

  return {
    alerts,
    isLoading,
    error,
    isConnected,
    refetch: fetchAlerts,
  };
}
