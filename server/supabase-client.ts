import { createClient } from "@supabase/supabase-js";
import { ENV } from "./_core/env";

// Server-side Supabase client with service role key (admin access)
export function getSupabaseAdmin() {
  return createClient(
    ENV.supabaseUrl,
    ENV.supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Types for database tables
export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          name: string;
          code: string;
          type: "HQ" | "CORPORATE" | "B2C";
          address: string | null;
          timezone: string;
          contact: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["branches"]["Row"], "id" | "created_at" | "updated_at">;
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "super_admin" | "hq" | "branch_admin" | "driver" | "tech" | "corporate_admin";
          branch_id: string | null;
          phone: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at">;
      };
      vehicles: {
        Row: {
          id: string;
          plate_no: string;
          vin: string;
          make: string;
          model: string;
          year: number | null;
          current_status: "AVAILABLE" | "ON_RENT" | "IN_TRANSIT" | "PENDING_INSPECTION" | "MAINTENANCE" | "ACCIDENT";
          mileage: number;
          current_branch_id: string | null;
          metadata: Record<string, any>;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["vehicles"]["Row"], "id" | "created_at" | "updated_at">;
      };
      handshakes: {
        Row: {
          id: string;
          handshake_ref: string;
          vehicle_id: string;
          from_branch_id: string;
          to_branch_id: string;
          requested_by: string;
          accepted_by: string | null;
          status: "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";
          eta: string | null;
          documents: Array<any>;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["handshakes"]["Row"], "id" | "created_at" | "updated_at">;
      };
      inspections: {
        Row: {
          id: string;
          vehicle_id: string;
          performed_by: string;
          branch_id: string;
          mileage: number | null;
          result: "CLEAN" | "DAMAGE" | "SERVICE_DUE";
          notes: string | null;
          photos: Array<any>;
          checklist: Array<any>;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["inspections"]["Row"], "id" | "created_at">;
      };
      rentals: {
        Row: {
          id: string;
          contract_no: string;
          vehicle_id: string;
          customer: Record<string, any>;
          start_at: string;
          end_at: string;
          status: "ACTIVE" | "CLOSED" | "CANCELLED";
          contract_doc: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["rentals"]["Row"], "id" | "created_at" | "updated_at">;
      };
      corporates: {
        Row: {
          id: string;
          name: string;
          key_contact: string | null;
          email: string | null;
          phone: string | null;
          msa_expiry: string | null;
          msa_document: string | null;
          metadata: Record<string, any>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["corporates"]["Row"], "id" | "created_at" | "updated_at">;
      };
      alerts: {
        Row: {
          id: string;
          type: "MAINTENANCE" | "INSPECTION" | "RENTAL_EXPIRY" | "MSA_EXPIRY" | "ACCIDENT" | "HANDSHAKE" | "CUSTOM";
          reference_id: string | null;
          severity: "INFO" | "WARNING" | "CRITICAL";
          message: string;
          acknowledged_by: string | null;
          acknowledged_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["alerts"]["Row"], "id" | "created_at">;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          resource: string;
          resource_id: string | null;
          payload: Record<string, any> | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at">;
      };
      telemetry: {
        Row: {
          id: string;
          vehicle_id: string;
          timestamp: string;
          lat: number | null;
          lon: number | null;
          speed: number | null;
          heading: number | null;
          payload: Record<string, any>;
        };
        Insert: Omit<Database["public"]["Tables"]["telemetry"]["Row"], "id">;
      };
      maintenance_tickets: {
        Row: {
          id: string;
          vehicle_id: string;
          reported_by: string;
          assigned_to: string | null;
          status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
          priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["maintenance_tickets"]["Row"], "id" | "created_at" | "updated_at">;
      };
    };
  };
};
