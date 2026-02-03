import { router, protectedProcedure } from "../_core/trpc";
import { getSupabaseAdmin } from "../supabase-client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const createInspectionSchema = z.object({
  vehicle_id: z.string().uuid("Invalid vehicle ID"),
  branch_id: z.string().uuid("Invalid branch ID"),
  mileage: z.number().int().optional(),
  result: z.enum(["CLEAN", "DAMAGE", "SERVICE_DUE"]),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
  checklist: z.array(z.object({
    item: z.string(),
    passed: z.boolean(),
  })).optional(),
});

export const inspectionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string().uuid().optional(),
        branchId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      let query = supabase
        .from("inspections")
        .select("*", { count: "exact" });

      if (input.vehicleId) {
        query = query.eq("vehicle_id", input.vehicleId);
      }

      if (input.branchId) {
        query = query.eq("branch_id", input.branchId);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { inspections: data || [], total: count || 0 };
    }),

  getById: protectedProcedure
    .input(z.string().uuid("Invalid inspection ID"))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("inspections")
        .select("*")
        .eq("id", input)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Inspection not found",
        });
      }

      return data;
    }),

  create: protectedProcedure
    .input(createInspectionSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Check permissions
      if (!["super_admin", "hq", "branch_admin", "tech", "driver"].includes(ctx.user?.role || "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create inspections",
        });
      }

      // Verify vehicle exists
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("id, current_status")
        .eq("id", input.vehicle_id)
        .single();

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      const { data: inspection, error } = await supabase
        .from("inspections")
        .insert([
          {
            vehicle_id: input.vehicle_id,
            performed_by: ctx.user?.id,
            branch_id: input.branch_id,
            mileage: input.mileage,
            result: input.result,
            notes: input.notes,
            photos: input.photos || [],
            checklist: input.checklist || [],
          },
        ])
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.message,
        });
      }

      // Update vehicle status based on inspection result
      let newStatus = "AVAILABLE";
      if (input.result === "DAMAGE") {
        newStatus = "ACCIDENT";
      } else if (input.result === "SERVICE_DUE") {
        newStatus = "MAINTENANCE";
      }

      if (vehicle.current_status === "PENDING_INSPECTION") {
        await supabase
          .from("vehicles")
          .update({
            current_status: newStatus,
            mileage: input.mileage,
            updated_by: ctx.user?.id,
          })
          .eq("id", input.vehicle_id);

        // Create alert if needed
        if (["DAMAGE", "SERVICE_DUE"].includes(input.result)) {
          await supabase.from("alerts").insert([
            {
              type: input.result === "DAMAGE" ? "ACCIDENT" : "MAINTENANCE",
              reference_id: input.vehicle_id,
              severity: "WARNING",
              message: `Inspection completed for vehicle ${input.vehicle_id}: ${input.result}`,
            },
          ]);

          // Create maintenance ticket
          await supabase.from("maintenance_tickets").insert([
            {
              vehicle_id: input.vehicle_id,
              reported_by: ctx.user?.id,
              status: "OPEN",
              priority: input.result === "DAMAGE" ? "HIGH" : "MEDIUM",
              notes: `Auto-created from inspection: ${input.notes || "No notes"}`,
            },
          ]);
        }
      }

      return inspection;
    }),
});
