/**
 * Demo Script: SendGrid Email Trigger Testing
 *
 * This script tests SendGrid email triggers by simulating handshake and
 * maintenance ticket creation events and verifying email delivery.
 *
 * Usage:
 *   pnpm tsx scripts/demo-sendgrid-test.ts
 *
 * Prerequisites:
 *   - Supabase project configured
 *   - SUPABASE_SERVICE_ROLE_KEY set in environment
 *   - SENDGRID_API_KEY set in environment
 *   - SendGrid account with verified sender domain
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const sendgridApiKey = process.env.SENDGRID_API_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials");
  console.error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!sendgridApiKey) {
  console.warn("⚠️  SENDGRID_API_KEY not set - email sending will be skipped");
  console.warn("Set SENDGRID_API_KEY to test email delivery");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SendGrid API endpoint
const SENDGRID_API = "https://api.sendgrid.com/v3/mail/send";

// Sample email templates
const EMAIL_TEMPLATES = {
  handshakeCreated: {
    subject: "Vehicle Handshake Request",
    html: `
      <h2>Vehicle Handshake Request</h2>
      <p>A new vehicle handshake has been initiated.</p>
      <p><strong>Vehicle:</strong> {vehicle_plate}</p>
      <p><strong>From:</strong> {sender_name}</p>
      <p><strong>To:</strong> {receiver_name}</p>
      <p><strong>Mileage:</strong> {mileage} km</p>
      <p>Please accept or decline this handshake in the Marsana Fleet app.</p>
    `,
  },
  handshakeAccepted: {
    subject: "Vehicle Handshake Accepted",
    html: `
      <h2>Vehicle Handshake Accepted</h2>
      <p>A vehicle handshake has been accepted.</p>
      <p><strong>Vehicle:</strong> {vehicle_plate}</p>
      <p><strong>Accepted By:</strong> {receiver_name}</p>
      <p><strong>Timestamp:</strong> {timestamp}</p>
      <p>The vehicle is now in transit.</p>
    `,
  },
  maintenanceTicket: {
    subject: "Maintenance Ticket Created",
    html: `
      <h2>Maintenance Ticket Created</h2>
      <p>A new maintenance ticket has been assigned to you.</p>
      <p><strong>Vehicle:</strong> {vehicle_plate}</p>
      <p><strong>Type:</strong> {ticket_type}</p>
      <p><strong>Priority:</strong> {priority}</p>
      <p><strong>Description:</strong> {description}</p>
      <p>Please review and update the ticket status in the Marsana Fleet app.</p>
    `,
  },
  msaExpiry: {
    subject: "MSA Expiry Reminder",
    html: `
      <h2>MSA Expiry Reminder</h2>
      <p>The MSA for the following vehicle is expiring soon.</p>
      <p><strong>Vehicle:</strong> {vehicle_plate}</p>
      <p><strong>Expiry Date:</strong> {expiry_date}</p>
      <p><strong>Days Remaining:</strong> {days_remaining}</p>
      <p>Please renew the MSA to avoid service interruption.</p>
    `,
  },
  rentalExpiry: {
    subject: "Rental Expiry Reminder",
    html: `
      <h2>Rental Expiry Reminder</h2>
      <p>A rental booking is expiring soon.</p>
      <p><strong>Vehicle:</strong> {vehicle_plate}</p>
      <p><strong>Customer:</strong> {customer_name}</p>
      <p><strong>Expiry Date:</strong> {expiry_date}</p>
      <p><strong>Hours Remaining:</strong> {hours_remaining}</p>
      <p>Please complete the rental return process.</p>
    `,
  },
};

// Test email sending
async function testEmailSending() {
  console.log("\n📧 Testing SendGrid Email Sending...\n");

  if (!sendgridApiKey) {
    console.log("⚠️  SENDGRID_API_KEY not configured - skipping email test");
    return;
  }

  try {
    // Get test user email
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, email, name")
      .limit(1);

    if (userError) throw userError;

    if (!users || users.length === 0) {
      console.log("⚠️  No users found in database");
      return;
    }

    const testUser = users[0];

    if (!testUser.email) {
      console.log("⚠️  Test user has no email address");
      return;
    }

    // Prepare test email
    const testEmail = {
      personalizations: [
        {
          to: [{ email: testUser.email, name: testUser.name || "Test User" }],
        },
      ],
      from: {
        email: "noreply@marsana.com",
        name: "Marsana Fleet",
      },
      subject: "Test Email - Marsana Fleet",
      html: `
        <h2>Test Email</h2>
        <p>This is a test email from Marsana Fleet.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, SendGrid is working correctly.</p>
      `,
    };

    console.log(`📨 Sending test email to: ${testUser.email}`);
    console.log(`📝 Subject: ${testEmail.subject}`);

    // Send via SendGrid API
    const response = await fetch(SENDGRID_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testEmail),
    });

    if (response.ok) {
      console.log(`✅ Test email sent successfully`);
      console.log(`📊 SendGrid Response: ${response.status} ${response.statusText}`);
    } else {
      const error = await response.text();
      console.error(`❌ Failed to send test email: ${response.status}`);
      console.error(`Error: ${error}`);
    }
  } catch (error) {
    console.error("❌ Error in email test:", error);
  }
}

// Simulate handshake created email
async function simulateHandshakeCreatedEmail() {
  console.log("\n📧 Simulating Handshake Created Email...\n");

  try {
    // Get test data
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, license_plate")
      .limit(1);

    const { data: users } = await supabase.from("users").select("id, email, name").limit(2);

    if (!vehicles || !users || users.length < 2) {
      console.log("⚠️  Insufficient test data");
      return;
    }

    const vehicle = vehicles[0];
    const sender = users[0];
    const receiver = users[1];

    console.log(`📝 Email Template: Handshake Created`);
    console.log(`📤 From: ${sender.name} <${sender.email}>`);
    console.log(`📥 To: ${receiver.name} <${receiver.email}>`);
    console.log(`🚗 Vehicle: ${vehicle.license_plate}`);

    // Render template
    let html = EMAIL_TEMPLATES.handshakeCreated.html;
    html = html
      .replace("{vehicle_plate}", vehicle.license_plate)
      .replace("{sender_name}", sender.name || "Driver")
      .replace("{receiver_name}", receiver.name || "Driver")
      .replace("{mileage}", "45,230");

    console.log(`\n📧 Email Content Preview:`);
    console.log(`Subject: ${EMAIL_TEMPLATES.handshakeCreated.subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>/g, "").substring(0, 200)}...`);

    // Log payload
    const payload = {
      personalizations: [
        {
          to: [{ email: receiver.email, name: receiver.name }],
        },
      ],
      from: {
        email: "noreply@marsana.com",
        name: "Marsana Fleet",
      },
      subject: EMAIL_TEMPLATES.handshakeCreated.subject,
      html: html,
    };

    console.log(`\n📊 SendGrid Payload:`);
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("❌ Error in handshake email simulation:", error);
  }
}

// Simulate maintenance ticket email
async function simulateMaintenanceTicketEmail() {
  console.log("\n📧 Simulating Maintenance Ticket Email...\n");

  try {
    // Get test data
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, license_plate")
      .limit(1);

    const { data: users } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("role", "tech")
      .limit(1);

    if (!vehicles || !users) {
      console.log("⚠️  Insufficient test data");
      return;
    }

    const vehicle = vehicles[0];
    const tech = users[0] || { email: "tech@example.com", name: "Technician" };

    console.log(`📝 Email Template: Maintenance Ticket`);
    console.log(`📥 To: ${tech.name} <${tech.email}>`);
    console.log(`🚗 Vehicle: ${vehicle.license_plate}`);

    // Render template
    let html = EMAIL_TEMPLATES.maintenanceTicket.html;
    html = html
      .replace("{vehicle_plate}", vehicle.license_plate)
      .replace("{ticket_type}", "Oil Change")
      .replace("{priority}", "High")
      .replace(
        "{description}",
        "Vehicle requires scheduled oil change and filter replacement"
      );

    console.log(`\n📧 Email Content Preview:`);
    console.log(`Subject: ${EMAIL_TEMPLATES.maintenanceTicket.subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>/g, "").substring(0, 200)}...`);

    // Log payload
    const payload = {
      personalizations: [
        {
          to: [{ email: tech.email, name: tech.name }],
        },
      ],
      from: {
        email: "noreply@marsana.com",
        name: "Marsana Fleet",
      },
      subject: EMAIL_TEMPLATES.maintenanceTicket.subject,
      html: html,
    };

    console.log(`\n📊 SendGrid Payload:`);
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("❌ Error in maintenance ticket email simulation:", error);
  }
}

// Simulate MSA expiry reminder
async function simulateMSAExpiryEmail() {
  console.log("\n📧 Simulating MSA Expiry Reminder Email...\n");

  try {
    // Get test data
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, license_plate")
      .limit(1);

    const { data: users } = await supabase
      .from("users")
      .select("id, email, name")
      .eq("role", "branch_admin")
      .limit(1);

    if (!vehicles || !users) {
      console.log("⚠️  Insufficient test data");
      return;
    }

    const vehicle = vehicles[0];
    const manager = users[0] || { email: "manager@example.com", name: "Manager" };

    console.log(`📝 Email Template: MSA Expiry Reminder`);
    console.log(`📥 To: ${manager.name} <${manager.email}>`);
    console.log(`🚗 Vehicle: ${vehicle.license_plate}`);

    // Render template
    let html = EMAIL_TEMPLATES.msaExpiry.html;
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    html = html
      .replace("{vehicle_plate}", vehicle.license_plate)
      .replace("{expiry_date}", expiryDate.toLocaleDateString())
      .replace("{days_remaining}", "7");

    console.log(`\n📧 Email Content Preview:`);
    console.log(`Subject: ${EMAIL_TEMPLATES.msaExpiry.subject}`);
    console.log(`Body:\n${html.replace(/<[^>]*>/g, "").substring(0, 200)}...`);

    // Log payload
    const payload = {
      personalizations: [
        {
          to: [{ email: manager.email, name: manager.name }],
        },
      ],
      from: {
        email: "noreply@marsana.com",
        name: "Marsana Fleet",
      },
      subject: EMAIL_TEMPLATES.msaExpiry.subject,
      html: html,
    };

    console.log(`\n📊 SendGrid Payload:`);
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    console.error("❌ Error in MSA expiry email simulation:", error);
  }
}

// Main function
async function main() {
  console.log("🎬 Marsana Fleet - SendGrid Email Trigger Testing");
  console.log("=================================================\n");

  console.log("📋 Instructions:");
  console.log("1. This script simulates email triggers and shows payloads");
  console.log("2. If SENDGRID_API_KEY is set, a test email will be sent");
  console.log("3. Review email templates and payloads for accuracy");
  console.log("4. Check SendGrid dashboard for delivery status\n");

  // Run simulations
  await testEmailSending();
  await simulateHandshakeCreatedEmail();
  await simulateMaintenanceTicketEmail();
  await simulateMSAExpiryEmail();

  console.log("\n✅ Email trigger simulation complete!");
  console.log(
    "Review the payloads above and verify they match your SendGrid templates.\n"
  );
}

main().catch(console.error);
