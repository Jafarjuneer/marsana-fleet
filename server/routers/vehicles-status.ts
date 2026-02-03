import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createSupabaseServerClient } from "../_core/auth";
import { TRPCError } from "@trpc/server";

const stateTransitions: Record<string, string[]> = {
  AVAILABLE: ["ON_RENT", "IN_TRANSIT", "MAINTENANCE", "ACCIDENT"],
  ON_RENT: ["PENDING_INSPECTION"],
  IN_TRANSIT: ["PENDING_INSPECTION"],
  PENDING_INSPECTION: ["AVAILABLE", "MAINTENANCE", "ACCIDENT"],
  MAINTENANCE: ["AVAILABLE"],
  ACCIDENT: ["MAINTENANCE"],
};

export const vehicleStatusRouter = router({
  /**
   * Change vehicle status with state machine validation
   */
  changeStatus: protectedProcedure
    .input(
      z.object({
        vehicleId: z.string().uuid(),
        newStatus: z.enum([
          "AVAILABLE",
          "ON_RENT",
          "IN_TRANSIT",
          "PENDING_INSPECTION",
          "MAINTENANCE",
          "ACCIDENT",
        ]),
        reason: z.string().optional(),
        mileage: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = createSupabaseServerClient();

      try {
        // Get current vehicle
        const { data: vehicle, error: vehicleError } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", input.vehicleId)
          .single();

        if (vehicleError || !vehicle) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vehicle not found",
          });
        }

        const currentStatus = (vehicle as any).current_status;

        // Validate transition
        const allowedTransitions = stateTransitions[currentStatus] || [];
        if (!allowedTransitions.includes(input.newStatus)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot transition from ${currentStatus} to ${input.newStatus}`,
          });
        }

        // Validate reason for certain statuses
        if (["ACCIDENT", "MAINTENANCE"].includes(input.newStatus) && !input.reason) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Reason is required for ${input.newStatus} status`,
          });
        }

        // Start transaction
        const updates: any = {
          current_status: input.newStatus,
          updated_at: new Date().toISOString(),
        };

        if (input.mileage) {
          updates.mileage = input.mileage;
        }

        // Update vehicle
        const { error: updateError } = await supabase
          .from("vehicles")
          .update(updates)
          .eq("id", input.vehicleId);

        if (updateError) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update vehicle",
          });
        }

        // Create maintenance ticket if needed
        if (input.newStatus === "MAINTENANCE" && input.reason) {
          const { error: ticketError } = await supabase
            .from("maintenance_tickets")
            .insert([
              {
                vehicle_id: input.vehicleId,
                status: "OPEN",
                description: input.reason,
                created_by: ctx.user?.id,
              } as any,
            ]);

          if (ticketError) {
            console.error("Failed to create maintenance ticket:", ticketError);
          }
        }

        // Create alert if needed
        if (["ACCIDENT", "MAINTENANCE"].includes(input.newStatus)) {
          const { error: alertError } = await supabase
            .from("alerts")
            .insert([
              {
                vehicle_id: input.vehicleId,
                alert_type: input.newStatus === "ACCIDENT" ? "ACCIDENT" : "MAINTENANCE_DUE",
                status: "OPEN",
                description: input.reason,
                created_by: ctx.user?.id,
              } as any,
            ]);

          if (alertError) {
            console.error("Failed to create alert:", alertError);
          }
        }

        // Write audit log
        const { error: auditError } = await supabase
          .from("audit_logs")
          .insert([
            {
              entity_type: "vehicle",
              entity_id: input.vehicleId,
              action: "status_change",
              old_values: { status: currentStatus },
              new_values: { status: input.newStatus },
              changed_by: ctx.user?.id,
              change_reason: input.reason,
            } as any,
          ]);

        if (auditError) {
          console.error("Failed to write audit log:", auditError);
        }

        // Return updated vehicle
        const { data: updatedVehicle } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", input.vehicleId)
          .single();

        return {
          success: true,
          vehicle: updatedVehicle,
          sideEffects: {
            maintenanceTicketCreated: input.newStatus === "MAINTENANCE",
            alertCreated: ["ACCIDENT", "MAINTENANCE"].includes(input.newStatus),
          },
        };
      } catch (error) {
        console.error("Error changing vehicle status:", error);
        throw error;
      }
    }),
});
