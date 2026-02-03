import sgMail from "@sendgrid/mail";
import { ENV } from "../_core/env";

// Initialize SendGrid
if (ENV.sendgridApiKey) {
  sgMail.setApiKey(ENV.sendgridApiKey);
}

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface HandshakeCreatedEmail {
  recipientEmail: string;
  recipientName: string;
  vehicleLicensePlate: string;
  fromBranch: string;
  toBranch: string;
  handshakeId: string;
}

export interface HandshakeAcceptedEmail {
  recipientEmail: string;
  recipientName: string;
  vehicleLicensePlate: string;
  acceptedByName: string;
  handshakeId: string;
}

export interface MaintenanceTicketEmail {
  recipientEmail: string;
  recipientName: string;
  vehicleLicensePlate: string;
  ticketId: string;
  description: string;
  priority: string;
}

export interface ExpiryReminderEmail {
  recipientEmail: string;
  recipientName: string;
  entityType: "MSA" | "RENTAL";
  entityId: string;
  daysUntilExpiry: number;
  expiryDate: string;
}

/**
 * Send handshake created notification
 */
export async function sendHandshakeCreatedEmail(data: HandshakeCreatedEmail) {
  if (!ENV.sendgridApiKey) {
    console.warn("SendGrid API key not configured, skipping email");
    return { success: false, error: "SendGrid not configured" };
  }

  try {
    const html = `
      <h2>New Vehicle Handshake</h2>
      <p>Hi ${data.recipientName},</p>
      <p>A new vehicle handshake has been created for you:</p>
      <ul>
        <li><strong>Vehicle:</strong> ${data.vehicleLicensePlate}</li>
        <li><strong>From:</strong> ${data.fromBranch}</li>
        <li><strong>To:</strong> ${data.toBranch}</li>
      </ul>
      <p><a href="${process.env.VITE_APP_URL}/handshakes/${data.handshakeId}">View Handshake</a></p>
    `;

    await sgMail.send({
      to: data.recipientEmail,
      from: ENV.sendgridFromEmail || "noreply@marsana.com",
      subject: `New Vehicle Handshake - ${data.vehicleLicensePlate}`,
      html,
      text: `New handshake for ${data.vehicleLicensePlate} from ${data.fromBranch} to ${data.toBranch}`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send handshake created email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send handshake accepted notification
 */
export async function sendHandshakeAcceptedEmail(data: HandshakeAcceptedEmail) {
  if (!ENV.sendgridApiKey) {
    console.warn("SendGrid API key not configured, skipping email");
    return { success: false, error: "SendGrid not configured" };
  }

  try {
    const html = `
      <h2>Vehicle Handshake Accepted</h2>
      <p>Hi ${data.recipientName},</p>
      <p>The handshake for vehicle ${data.vehicleLicensePlate} has been accepted by ${data.acceptedByName}.</p>
      <p><a href="${process.env.VITE_APP_URL}/handshakes/${data.handshakeId}">View Handshake</a></p>
    `;

    await sgMail.send({
      to: data.recipientEmail,
      from: ENV.sendgridFromEmail || "noreply@marsana.com",
      subject: `Handshake Accepted - ${data.vehicleLicensePlate}`,
      html,
      text: `Handshake for ${data.vehicleLicensePlate} has been accepted`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send handshake accepted email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send maintenance ticket notification
 */
export async function sendMaintenanceTicketEmail(data: MaintenanceTicketEmail) {
  if (!ENV.sendgridApiKey) {
    console.warn("SendGrid API key not configured, skipping email");
    return { success: false, error: "SendGrid not configured" };
  }

  try {
    const html = `
      <h2>New Maintenance Ticket</h2>
      <p>Hi ${data.recipientName},</p>
      <p>A new maintenance ticket has been created:</p>
      <ul>
        <li><strong>Vehicle:</strong> ${data.vehicleLicensePlate}</li>
        <li><strong>Description:</strong> ${data.description}</li>
        <li><strong>Priority:</strong> ${data.priority}</li>
      </ul>
      <p><a href="${process.env.VITE_APP_URL}/maintenance/${data.ticketId}">View Ticket</a></p>
    `;

    await sgMail.send({
      to: data.recipientEmail,
      from: ENV.sendgridFromEmail || "noreply@marsana.com",
      subject: `New Maintenance Ticket - ${data.vehicleLicensePlate}`,
      html,
      text: `New maintenance ticket for ${data.vehicleLicensePlate}: ${data.description}`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send maintenance ticket email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send expiry reminder email
 */
export async function sendExpiryReminderEmail(data: ExpiryReminderEmail) {
  if (!ENV.sendgridApiKey) {
    console.warn("SendGrid API key not configured, skipping email");
    return { success: false, error: "SendGrid not configured" };
  }

  try {
    const entityLabel = data.entityType === "MSA" ? "MSA" : "Rental";
    const html = `
      <h2>${entityLabel} Expiry Reminder</h2>
      <p>Hi ${data.recipientName},</p>
      <p>Your ${entityLabel} expires in ${data.daysUntilExpiry} days on ${data.expiryDate}.</p>
      <p>Please take action to renew or extend if needed.</p>
      <p><a href="${process.env.VITE_APP_URL}/${data.entityType.toLowerCase()}s/${data.entityId}">View Details</a></p>
    `;

    await sgMail.send({
      to: data.recipientEmail,
      from: ENV.sendgridFromEmail || "noreply@marsana.com",
      subject: `${entityLabel} Expiry Reminder - ${data.daysUntilExpiry} Days`,
      html,
      text: `Your ${entityLabel} expires in ${data.daysUntilExpiry} days`,
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send expiry reminder email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Send bulk email
 */
export async function sendBulkEmail(emails: EmailTemplate[]) {
  if (!ENV.sendgridApiKey) {
    console.warn("SendGrid API key not configured, skipping email");
    return { success: false, error: "SendGrid not configured", sent: 0 };
  }

  try {
    const messages = emails.map((email) => ({
      to: email.to,
      from: ENV.sendgridFromEmail || "noreply@marsana.com",
      subject: email.subject,
      html: email.html,
      text: email.text,
    }));

    const result = await sgMail.sendMultiple({
      personalizations: messages.map((msg) => ({
        to: [{ email: msg.to }],
        subject: msg.subject,
      })),
      from: { email: ENV.sendgridFromEmail || "noreply@marsana.com" },
      content: [{ type: "text/html", value: messages[0]?.html || "" }],
    });

    return { success: true, sent: messages.length };
  } catch (error) {
    console.error("Failed to send bulk email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", sent: 0 };
  }
}
