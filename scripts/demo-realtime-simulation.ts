/**
 * Demo Script: Realtime Simulation
 *
 * This script simulates vehicle status changes and handshake events
 * to demonstrate real-time updates in the Marsana Fleet dashboard.
 *
 * Usage:
 *   pnpm tsx scripts/demo-realtime-simulation.ts
 *
 * Prerequisites:
 *   - Supabase project configured
 *   - SUPABASE_SERVICE_ROLE_KEY set in environment
 *   - Dashboard open in browser to see live updates
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Vehicle {
  id: string;
  license_plate: string;
  current_status: string;
}

interface Handshake {
  id: string;
  vehicle_id: string;
  status: string;
}

// Simulate vehicle status changes
async function simulateVehicleStatusChanges() {
  console.log("\n📍 Simulating vehicle status changes...\n");

  try {
    // Get first 3 vehicles
    const { data: vehicles, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, license_plate, current_status")
      .limit(3);

    if (vehicleError) throw vehicleError;

    if (!vehicles || vehicles.length === 0) {
      console.log("⚠️  No vehicles found in database");
      return;
    }

    const statuses = ["AVAILABLE", "IN_USE", "MAINTENANCE", "ACCIDENT"];

    for (const vehicle of vehicles) {
      const currentStatus = vehicle.current_status;
      const newStatus = statuses.find((s) => s !== currentStatus) || "AVAILABLE";

      console.log(
        `🔄 Changing vehicle ${vehicle.license_plate} from ${currentStatus} to ${newStatus}`
      );

      const { error } = await supabase
        .from("vehicles")
        .update({
          current_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vehicle.id);

      if (error) {
        console.error(`❌ Error updating vehicle: ${error.message}`);
      } else {
        console.log(`✅ Vehicle ${vehicle.license_plate} status updated`);
      }

      // Wait 2 seconds between updates
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("❌ Error in vehicle simulation:", error);
  }
}

// Simulate handshake events
async function simulateHandshakeEvents() {
  console.log("\n🤝 Simulating handshake events...\n");

  try {
    // Get first vehicle
    const { data: vehicles, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, license_plate")
      .limit(1);

    if (vehicleError) throw vehicleError;

    if (!vehicles || vehicles.length === 0) {
      console.log("⚠️  No vehicles found in database");
      return;
    }

    const vehicle = vehicles[0];

    // Get first two users
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, name")
      .limit(2);

    if (userError) throw userError;

    if (!users || users.length < 2) {
      console.log("⚠️  Not enough users in database for handshake simulation");
      return;
    }

    const sender = users[0];
    const receiver = users[1];

    // Create handshake
    console.log(
      `📤 Creating handshake from ${sender.name} to ${receiver.name} for vehicle ${vehicle.license_plate}`
    );

    const { data: handshake, error: createError } = await supabase
      .from("handshakes")
      .insert({
        vehicle_id: vehicle.id,
        sender_id: sender.id,
        receiver_id: receiver.id,
        status: "PENDING",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    console.log(`✅ Handshake created with ID: ${handshake.id}`);

    // Wait 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Accept handshake
    console.log(`✅ Accepting handshake...`);

    const { error: acceptError } = await supabase
      .from("handshakes")
      .update({
        status: "ACCEPTED",
        accepted_by: receiver.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", handshake.id);

    if (acceptError) throw acceptError;

    console.log(`✅ Handshake accepted`);

    // Wait 3 seconds
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Complete handshake
    console.log(`🏁 Completing handshake...`);

    const { error: completeError } = await supabase
      .from("handshakes")
      .update({
        status: "COMPLETED",
        completed_at: new Date().toISOString(),
      })
      .eq("id", handshake.id);

    if (completeError) throw completeError;

    console.log(`✅ Handshake completed`);
  } catch (error) {
    console.error("❌ Error in handshake simulation:", error);
  }
}

// Simulate alert creation
async function simulateAlertCreation() {
  console.log("\n🚨 Simulating alert creation...\n");

  try {
    // Get first vehicle
    const { data: vehicles, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, license_plate")
      .limit(1);

    if (vehicleError) throw vehicleError;

    if (!vehicles || vehicles.length === 0) {
      console.log("⚠️  No vehicles found in database");
      return;
    }

    const vehicle = vehicles[0];

    const alerts = [
      {
        type: "MAINTENANCE_DUE",
        title: "Maintenance Due",
        description: `Vehicle ${vehicle.license_plate} is due for maintenance`,
      },
      {
        type: "INSPECTION_DUE",
        title: "Inspection Due",
        description: `Vehicle ${vehicle.license_plate} is due for inspection`,
      },
      {
        type: "ACCIDENT_REPORTED",
        title: "Accident Reported",
        description: `Vehicle ${vehicle.license_plate} has been in an accident`,
      },
    ];

    for (const alert of alerts) {
      console.log(`🚨 Creating alert: ${alert.title}`);

      const { error } = await supabase.from("alerts").insert({
        vehicle_id: vehicle.id,
        alert_type: alert.type,
        title: alert.title,
        description: alert.description,
        status: "OPEN",
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error(`❌ Error creating alert: ${error.message}`);
      } else {
        console.log(`✅ Alert created: ${alert.title}`);
      }

      // Wait 2 seconds between alerts
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("❌ Error in alert simulation:", error);
  }
}

// Main function
async function main() {
  console.log("🎬 Marsana Fleet - Realtime Simulation Demo");
  console.log("==========================================\n");

  console.log("📋 Instructions:");
  console.log("1. Open the Marsana Fleet dashboard in your browser");
  console.log("2. Watch for live updates as this script simulates events");
  console.log("3. Vehicle status changes should appear in real-time");
  console.log("4. Handshake events should trigger notifications");
  console.log("5. Alerts should appear in the alerts panel\n");

  // Run simulations
  await simulateVehicleStatusChanges();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await simulateHandshakeEvents();
  await new Promise((resolve) => setTimeout(resolve, 2000));

  await simulateAlertCreation();

  console.log("\n✅ Simulation complete!");
  console.log("Check your dashboard for live updates.\n");
}

main().catch(console.error);
