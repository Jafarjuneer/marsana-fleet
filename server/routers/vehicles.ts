import { router, protectedProcedure } from "../_core/trpc";
import { getSupabaseAdmin } from "../supabase-client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const vehicleStatusEnum = z.enum([
  "AVAILABLE",
  "ON_RENT",
  "IN_TRANSIT",
  "PENDING_INSPECTION",
  "MAINTENANCE",
  "ACCIDENT",
]);

const createVehicleSchema = z.object({
  plate_no: z.string().min(1, "Plate number is required"),
  vin: z.string().min(1, "VIN is required"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(2100).optional(),
  current_branch_id: z.string().uuid("Invalid branch ID"),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateVehicleStatusSchema = z.object({
  vehicleId: z.string().uuid("Invalid vehicle ID"),
  newStatus: vehicleStatusEnum,
  reason: z.string().optional(),
  mileage: z.number().int().optional(),
});

export const vehiclesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: vehicleStatusEnum.optional(),
        branchId: z.string().uuid().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      let query = supabase
        .from("vehicles")
        .select("*", { count: "exact" })
        .is("deleted_at", null);

      if (input.status) {
        query = query.eq("current_status", input.status);
      }

      if (input.branchId) {
        query = query.eq("current_branch_id", input.branchId);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { vehicles: data || [], total: count || 0 };
    }),

  getById: protectedProcedure
    .input(z.string().uuid("Invalid vehicle ID"))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", input)
        .is("deleted_at", null)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      return data;
    }),

  create: protectedProcedure
    .input(createVehicleSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Check if user has permission to create vehicles
      if (!["super_admin", "hq", "branch_admin"].includes(ctx.user?.role || "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create vehicles",
        });
      }

      const { data, error } = await supabase
        .from("vehicles")
        .insert([
          {
            ...input,
            created_by: ctx.user?.id,
            updated_by: ctx.user?.id,
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

      return data;
    }),

  updateStatus: protectedProcedure
    .input(updateVehicleStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Validate state machine transition
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("current_status")
        .eq("id", input.vehicleId)
        .single();

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      // State machine validation
      const validTransitions: Record<string, string[]> = {
        AVAILABLE: ["ON_RENT", "IN_TRANSIT", "MAINTENANCE", "ACCIDENT"],
        ON_RENT: ["PENDING_INSPECTION"],
        IN_TRANSIT: ["PENDING_INSPECTION"],
        PENDING_INSPECTION: ["AVAILABLE", "MAINTENANCE", "ACCIDENT"],
        MAINTENANCE: ["AVAILABLE"],
        ACCIDENT: ["MAINTENANCE"],
      };

      if (
        !validTransitions[vehicle.current_status]?.includes(input.newStatus)
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot transition from ${vehicle.current_status} to ${input.newStatus}`,
        });
      }

      // Update vehicle status
      const { data, error } = await supabase
        .from("vehicles")
        .update({
          current_status: input.newStatus,
          mileage: input.mileage,
          updated_by: ctx.user?.id,
        })
        .eq("id", input.vehicleId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Create alert if needed
      if (["MAINTENANCE", "ACCIDENT"].includes(input.newStatus)) {
        await supabase.from("alerts").insert([
          {
            type: input.newStatus === "ACCIDENT" ? "ACCIDENT" : "MAINTENANCE",
            reference_id: input.vehicleId,
            severity: "WARNING",
            message: `Vehicle ${input.vehicleId} status changed to ${input.newStatus}. Reason: ${input.reason || "Not specified"}`,
          },
        ]);
      }

      return data;
    }),

  delete: protectedProcedure
    .input(z.string().uuid("Invalid vehicle ID"))
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Check permissions
      if (!["super_admin", "hq"].includes(ctx.user?.role || "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete vehicles",
        });
      }

      // Soft delete
      const { error } = await supabase
        .from("vehicles")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", input);

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return { success: true };
    }),
});
