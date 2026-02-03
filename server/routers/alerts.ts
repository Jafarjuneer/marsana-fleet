import { router, protectedProcedure } from "../_core/trpc";
import { getSupabaseAdmin } from "../supabase-client";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const createAlertSchema = z.object({
  type: z.enum(["MAINTENANCE", "INSPECTION", "RENTAL_EXPIRY", "MSA_EXPIRY", "ACCIDENT", "HANDSHAKE", "CUSTOM"]),
  reference_id: z.string().uuid().optional(),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]).default("INFO"),
  message: z.string().min(1, "Message is required"),
});

const acknowledgeAlertSchema = z.object({
  alert_id: z.string().uuid("Invalid alert ID"),
});

export const alertsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        severity: z.enum(["INFO", "WARNING", "CRITICAL"]).optional(),
        acknowledged: z.boolean().optional(),
        limit: z.number().int().min(1).max(100).default(50),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      let query = supabase
        .from("alerts")
        .select("*", { count: "exact" });

      if (input.type) {
        query = query.eq("type", input.type);
      }

      if (input.severity) {
        query = query.eq("severity", input.severity);
      }

      if (input.acknowledged !== undefined) {
        if (input.acknowledged) {
          query = query.not("acknowledged_by", "is", null);
        } else {
          query = query.is("acknowledged_by", null);
        }
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

      return { alerts: data || [], total: count || 0 };
    }),

  getById: protectedProcedure
    .input(z.string().uuid("Invalid alert ID"))
    .query(async ({ input }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .eq("id", input)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Alert not found",
        });
      }

      return data;
    }),

  create: protectedProcedure
    .input(createAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      // Check permissions
      if (!["super_admin", "hq", "branch_admin", "tech"].includes(ctx.user?.role || "")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to create alerts",
        });
      }

      const { data, error } = await supabase
        .from("alerts")
        .insert([
          {
            type: input.type,
            reference_id: input.reference_id,
            severity: input.severity,
            message: input.message,
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

  acknowledge: protectedProcedure
    .input(acknowledgeAlertSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseAdmin();

      const { data, error } = await supabase
        .from("alerts")
        .update({
          acknowledged_by: ctx.user?.id,
          acknowledged_at: new Date().toISOString(),
        })
        .eq("id", input.alert_id)
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
