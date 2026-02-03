import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface Handshake {
  id: string;
  vehicle_id: string;
  from_branch_id: string;
  to_branch_id: string;
  status: string;
  created_by: string;
  accepted_by?: string;
  accepted_at?: string;
  completed_at?: string;
  updated_at: string;
  [key: string]: any;
}

interface UseRealtimeHandshakesOptions {
  branchId?: string;
  enabled?: boolean;
}

export function useRealtimeHandshakes(options: UseRealtimeHandshakesOptions = {}) {
  const { branchId, enabled = true } = options;
  const [handshakes, setHandshakes] = useState<Handshake[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const fetchHandshakes = useCallback(async () => {
    try {
      setIsLoading(true);
      let query = supabase.from("handshakes").select("*");

      if (branchId) {
        query = query.or(`from_branch_id.eq.${branchId},to_branch_id.eq.${branchId}`);
      }

      const { data, error: fetchError } = await query.order("created_at", {
        ascending: false,
      });

      if (fetchError) throw fetchError;
      setHandshakes(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch handshakes"));
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchHandshakes();

    // Subscribe to realtime updates
    let channel: RealtimeChannel | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const baseDelay = 1000;

    const subscribe = () => {
      channel = supabase
        .channel("handshakes-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "handshakes",
          },
          (payload) => {
            setIsConnected(true);
            reconnectAttempts = 0;

            if (payload.eventType === "DELETE") {
              setHandshakes((prev) => prev.filter((h) => h.id !== payload.old.id));
            } else if (payload.eventType === "INSERT") {
              setHandshakes((prev) => [payload.new as Handshake, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setHandshakes((prev) =>
                prev.map((h) => (h.id === payload.new.id ? (payload.new as Handshake) : h))
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
  }, [enabled, branchId, fetchHandshakes]);

  return {
    handshakes,
    isLoading,
    error,
    isConnected,
    refetch: fetchHandshakes,
  };
}
