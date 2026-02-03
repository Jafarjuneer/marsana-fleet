/**
 * Demo Script: Geofence Simulation
 *
 * This script simulates vehicle telemetry points crossing a geofence
 * and verifies that alerts are created when vehicles enter/exit the boundary.
 *
 * Usage:
 *   pnpm tsx scripts/demo-geofence-simulation.ts
 *
 * Prerequisites:
 *   - Supabase project configured
 *   - SUPABASE_SERVICE_ROLE_KEY set in environment
 *   - Geofence created in the system
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

// Sample geofence: Singapore CBD area
const SAMPLE_GEOFENCE = {
  name: "Singapore CBD",
  center_lat: 1.2802,
  center_lng: 103.8509,
  radius_km: 2,
};

// Sample telemetry points
const TELEMETRY_POINTS = [
  // Outside geofence
  { lat: 1.3521, lng: 103.8198, label: "Outside (North)" },
  // Moving towards geofence
  { lat: 1.3200, lng: 103.8350, label: "Approaching" },
  // Inside geofence
  { lat: 1.2802, lng: 103.8509, label: "Inside (Center)" },
  // Still inside
  { lat: 1.2750, lng: 103.8450, label: "Inside (South)" },
  // Moving out
  { lat: 1.2400, lng: 103.8600, label: "Exiting" },
  // Outside geofence
  { lat: 1.2000, lng: 103.8700, label: "Outside (South)" },
];

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Check if point is inside geofence
function isInsideGeofence(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(lat, lng, centerLat, centerLng);
  return distance <= radiusKm;
}

// Simulate geofence crossing
async function simulateGeofenceCrossing() {
  console.log("\n🗺️  Simulating geofence crossing...\n");

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

    console.log(
      `📍 Simulating geofence crossing for vehicle: ${vehicle.license_plate}`
    );
    console.log(
      `🎯 Geofence: ${SAMPLE_GEOFENCE.name} (${SAMPLE_GEOFENCE.center_lat}, ${SAMPLE_GEOFENCE.center_lng})`
    );
    console.log(`📏 Radius: ${SAMPLE_GEOFENCE.radius_km} km\n`);

    let lastWasInside = false;
    let alertCount = 0;

    for (const point of TELEMETRY_POINTS) {
      const isInside = isInsideGeofence(
        point.lat,
        point.lng,
        SAMPLE_GEOFENCE.center_lat,
        SAMPLE_GEOFENCE.center_lng,
        SAMPLE_GEOFENCE.radius_km
      );

      const distance = calculateDistance(
        point.lat,
        point.lng,
        SAMPLE_GEOFENCE.center_lat,
        SAMPLE_GEOFENCE.center_lng
      );

      console.log(
        `📍 ${point.label}: (${point.lat}, ${point.lng}) - Distance: ${distance.toFixed(2)}km - ${isInside ? "INSIDE" : "OUTSIDE"}`
      );

      // Detect entry/exit
      if (isInside && !lastWasInside) {
        console.log(`✅ Vehicle ENTERED geofence!`);

        // Create alert
        const { error } = await supabase.from("alerts").insert({
          vehicle_id: vehicle.id,
          alert_type: "GEOFENCE_ENTRY",
          title: "Geofence Entry",
          description: `Vehicle ${vehicle.license_plate} entered ${SAMPLE_GEOFENCE.name}`,
          status: "OPEN",
          metadata: {
            geofence_name: SAMPLE_GEOFENCE.name,
            event_type: "ENTRY",
            latitude: point.lat,
            longitude: point.lng,
          },
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error(`❌ Error creating entry alert: ${error.message}`);
        } else {
          console.log(`✅ Entry alert created`);
          alertCount++;
        }
      } else if (!isInside && lastWasInside) {
        console.log(`✅ Vehicle EXITED geofence!`);

        // Create alert
        const { error } = await supabase.from("alerts").insert({
          vehicle_id: vehicle.id,
          alert_type: "GEOFENCE_EXIT",
          title: "Geofence Exit",
          description: `Vehicle ${vehicle.license_plate} exited ${SAMPLE_GEOFENCE.name}`,
          status: "OPEN",
          metadata: {
            geofence_name: SAMPLE_GEOFENCE.name,
            event_type: "EXIT",
            latitude: point.lat,
            longitude: point.lng,
          },
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error(`❌ Error creating exit alert: ${error.message}`);
        } else {
          console.log(`✅ Exit alert created`);
          alertCount++;
        }
      }

      lastWasInside = isInside;
      console.log("");

      // Wait 2 seconds between points
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log(`\n📊 Simulation Summary:`);
    console.log(`   - Total points: ${TELEMETRY_POINTS.length}`);
    console.log(`   - Alerts created: ${alertCount}`);
    console.log(`   - Geofence crossings: ${alertCount}`);
  } catch (error) {
    console.error("❌ Error in geofence simulation:", error);
  }
}

// Create sample geofence
async function createSampleGeofence() {
  console.log("\n🎯 Creating sample geofence...\n");

  try {
    // Get first branch
    const { data: branches, error: branchError } = await supabase
      .from("branches")
      .select("id, name")
      .limit(1);

    if (branchError) throw branchError;

    if (!branches || branches.length === 0) {
      console.log("⚠️  No branches found in database");
      return;
    }

    const branch = branches[0];

    console.log(
      `📍 Creating geofence "${SAMPLE_GEOFENCE.name}" for branch: ${branch.name}`
    );

    // Note: Geofence table structure depends on your schema
    // This is a placeholder - adjust based on actual schema
    const { error } = await supabase.from("geofences").insert({
      branch_id: branch.id,
      name: SAMPLE_GEOFENCE.name,
      center_latitude: SAMPLE_GEOFENCE.center_lat,
      center_longitude: SAMPLE_GEOFENCE.center_lng,
      radius_km: SAMPLE_GEOFENCE.radius_km,
      created_at: new Date().toISOString(),
    });

    if (error) {
      if (error.message.includes("relation")) {
        console.log(
          "⚠️  Geofences table not found - skipping creation (pending schema update)"
        );
      } else {
        console.error(`❌ Error creating geofence: ${error.message}`);
      }
    } else {
      console.log(`✅ Geofence created successfully`);
    }
  } catch (error) {
    console.error("❌ Error in geofence creation:", error);
  }
}

// Main function
async function main() {
  console.log("🎬 Marsana Fleet - Geofence Simulation Demo");
  console.log("==========================================\n");

  console.log("📋 Instructions:");
  console.log("1. This script simulates a vehicle crossing a geofence boundary");
  console.log("2. Alerts will be created when vehicle enters/exits the geofence");
  console.log("3. Check the Alerts panel for GEOFENCE_ENTRY and GEOFENCE_EXIT alerts");
  console.log("4. Verify alert metadata contains geofence name and coordinates\n");

  // Create sample geofence (optional)
  await createSampleGeofence();

  // Run simulation
  await simulateGeofenceCrossing();

  console.log("\n✅ Simulation complete!");
  console.log("Check the Alerts panel for geofence entry/exit alerts.\n");
}

main().catch(console.error);
