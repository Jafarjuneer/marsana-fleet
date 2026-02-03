import { router, protectedProcedure } from "../_core/trpc";
import { getSupabaseAdmin } from "../supabase-client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

const createRentalSchema = z.object({
  vehicle_id: z.string().uuid("Invalid vehicle ID"),
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    phone: z.string().min(1, "Customer phone is required"),
    company: z.string().optional(),
  }),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  contract_doc: z.string().optional(),
});

const returnVehicleSchema = z.object({
  rental_id: z.string().uuid("Invalid rental ID"),
  odometer: z.number().int(),
  fuel_level: z.string().optional(),
  notes: z.string().optional(),
  photos: z.array(z.string()).optional(),
});

export const rentalsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["ACTIVE", "CLOSED", "CANCELLED"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      let query = supabase
        .from("rentals")
        .select("*", { count: "exact" });

      if (input.status) {
        query = query.eq("status", input.status);
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

      return { rentals: data || [], total: count || 0 };
    }),

  getById: protectedProcedure
    .input(z.string().uuid("Invalid rental ID"))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("rentals")
        .select("*")
        .eq("id", input)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rental not found",
        });
      }

      return data;
    }),

  create: protectedProcedure
    .input(createRentalSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Check permissions
      if (!["super_admin", "hq", "branch_admin", "corporate_admin"].includes(ctx.user?.role || "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create rentals",
        });
      }

      // Verify vehicle exists and is available
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("current_status")
        .eq("id", input.vehicle_id)
        .single();

      if (!vehicle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Vehicle not found",
        });
      }

      if (vehicle.current_status !== "AVAILABLE") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Vehicle must be AVAILABLE to rent, current status: ${vehicle.current_status}`,
        });
      }

      const contractNo = `CNT-${nanoid(10).toUpperCase()}`;

      const { data, error } = await supabase
        .from("rentals")
        .insert([
          {
            contract_no: contractNo,
            vehicle_id: input.vehicle_id,
            customer: input.customer,
            start_at: input.start_at,
            end_at: input.end_at,
            contract_doc: input.contract_doc,
            created_by: ctx.user?.id,
            status: "ACTIVE",
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

      // Update vehicle status to ON_RENT
      await supabase
        .from("vehicles")
        .update({
          current_status: "ON_RENT",
          updated_by: ctx.user?.id,
        })
        .eq("id", input.vehicle_id);

      return data;
    }),

  returnVehicle: protectedProcedure
    .input(returnVehicleSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Get rental
      const { data: rental } = await supabase
        .from("rentals")
        .select("*")
        .eq("id", input.rental_id)
        .single();

      if (!rental) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rental not found",
        });
      }

      // Update rental status
      const { data: updatedRental, error } = await supabase
        .from("rentals")
        .update({
          status: "CLOSED",
        })
        .eq("id", input.rental_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Update vehicle status to PENDING_INSPECTION
      await supabase
        .from("vehicles")
        .update({
          current_status: "PENDING_INSPECTION",
          mileage: input.odometer,
          updated_by: ctx.user?.id,
        })
        .eq("id", rental.vehicle_id);

      // Create inspection task
      await supabase.from("inspections").insert([
        {
          vehicle_id: rental.vehicle_id,
          performed_by: ctx.user?.id,
          branch_id: (await supabase.from("vehicles").select("current_branch_id").eq("id", rental.vehicle_id).single()).data?.current_branch_id,
          mileage: input.odometer,
          result: "CLEAN",
          notes: `Return inspection - ${input.notes || "No notes"}. Fuel level: ${input.fuel_level || "Not recorded"}`,
          photos: input.photos || [],
        },
      ]);

      return updatedRental;
    }),
});
