import { router, protectedProcedure } from "../_core/trpc";
import { getSupabaseAdmin } from "../supabase-client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";

const createHandshakeSchema = z.object({
  vehicle_id: z.string().uuid("Invalid vehicle ID"),
  from_branch_id: z.string().uuid("Invalid from branch ID"),
  to_branch_id: z.string().uuid("Invalid to branch ID"),
  eta: z.string().datetime().optional(),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

const acceptHandshakeSchema = z.object({
  handshake_id: z.string().uuid("Invalid handshake ID"),
});

const completeHandshakeSchema = z.object({
  handshake_id: z.string().uuid("Invalid handshake ID"),
});

const rejectHandshakeSchema = z.object({
  handshake_id: z.string().uuid("Invalid handshake ID"),
  reason: z.string().min(1, "Reason is required"),
});

export const handshakesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "COMPLETED"]).optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      let query = supabase
        .from("handshakes")
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

      return { handshakes: data || [], total: count || 0 };
    }),

  getById: protectedProcedure
    .input(z.string().uuid("Invalid handshake ID"))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("handshakes")
        .select("*")
        .eq("id", input)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Handshake not found",
        });
      }

      return data;
    }),

  create: protectedProcedure
    .input(createHandshakeSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Check permissions
      if (!["super_admin", "hq", "branch_admin"].includes(ctx.user?.role || "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create handshakes",
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
          message: `Vehicle must be AVAILABLE to create handshake, current status: ${vehicle.current_status}`,
        });
      }

      const handshakeRef = `HS-${nanoid(10).toUpperCase()}`;

      const { data, error } = await supabase
        .from("handshakes")
        .insert([
          {
            handshake_ref: handshakeRef,
            vehicle_id: input.vehicle_id,
            from_branch_id: input.from_branch_id,
            to_branch_id: input.to_branch_id,
            requested_by: ctx.user?.id,
            eta: input.eta,
            documents: input.documents || [],
            notes: input.notes,
            status: "PENDING",
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

  accept: protectedProcedure
    .input(acceptHandshakeSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Get handshake
      const { data: handshake } = await supabase
        .from("handshakes")
        .select("*")
        .eq("id", input.handshake_id)
        .single();

      if (!handshake) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Handshake not found",
        });
      }

      // Update handshake status
      const { data, error } = await supabase
        .from("handshakes")
        .update({
          status: "ACCEPTED",
          accepted_by: ctx.user?.id,
        })
        .eq("id", input.handshake_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Update vehicle status to IN_TRANSIT
      await supabase
        .from("vehicles")
        .update({
          current_status: "IN_TRANSIT",
          updated_by: ctx.user?.id,
        })
        .eq("id", handshake.vehicle_id);

      return data;
    }),

  complete: protectedProcedure
    .input(completeHandshakeSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Get handshake
      const { data: handshake } = await supabase
        .from("handshakes")
        .select("*")
        .eq("id", input.handshake_id)
        .single();

      if (!handshake) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Handshake not found",
        });
      }

      // Update handshake status
      const { data, error } = await supabase
        .from("handshakes")
        .update({
          status: "COMPLETED",
        })
        .eq("id", input.handshake_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      // Update vehicle: change branch and set to PENDING_INSPECTION
      await supabase
        .from("vehicles")
        .update({
          current_branch_id: handshake.to_branch_id,
          current_status: "PENDING_INSPECTION",
          updated_by: ctx.user?.id,
        })
        .eq("id", handshake.vehicle_id);

      return data;
    }),

  reject: protectedProcedure
    .input(rejectHandshakeSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("handshakes")
        .update({
          status: "REJECTED",
        })
        .eq("id", input.handshake_id)
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message,
        });
      }

      return data;
    }),
});
