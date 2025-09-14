if (typeof window !== "undefined") {
  throw new Error("email.adapter.ts is server-only");
}

import { Resend } from "resend";
import { logger } from "@/lib/logger";
import type { SendDecisionEmailOptions } from "@/types";

export interface EmailResult {
  id: string;
  success: boolean;
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("RESEND_API_KEY environment variable is required but not configured");
  }
  return new Resend(apiKey);
}

// sleep helper for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// calc exponential backoff delay
function getRetryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt - 1);
}

function getEmailSubject(decision: string, clientName: string): string {
  const subjectPrefix = `Case Decision - ${clientName}`;
  switch (decision) {
    case "ACCEPT":
      return `${subjectPrefix} - Accepted`;
    case "REVIEW":
      return `${subjectPrefix} - Under Review`;
    case "DECLINE":
      return `${subjectPrefix} - Declined`;
    default:
      return `${subjectPrefix} - Decision Made`;
  }
}

// generate email HTML content
function generateEmailHTML(options: SendDecisionEmailOptions): string {
  const { decision, clientName, caseId, score, reasons } = options;

  const decisionColor = {
    ACCEPT: "#10b981", // green
    REVIEW: "#f59e0b", // yellow
    DECLINE: "#ef4444", // red
  }[decision];

  const decisionText = {
    ACCEPT: "Accepted",
    REVIEW: "Under Review",
    DECLINE: "Declined",
  }[decision];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Case Decision - ${clientName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #f8fafc; padding: 30px; border-radius: 8px; border: 1px solid #e2e8f0;">
        <h1 style="color: #1e293b; margin-bottom: 20px;">Case Decision Notification</h1>
        
        <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px; border-left: 4px solid ${decisionColor};">
          <h2 style="color: ${decisionColor}; margin: 0 0 10px 0;">${decisionText}</h2>
          <p style="margin: 0; font-size: 16px;"><strong>Client:</strong> ${clientName}</p>
          <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Case ID:</strong> ${caseId}</p>
          <p style="margin: 5px 0 0 0; font-size: 16px;"><strong>Score:</strong> ${score}/100</p>
        </div>

        ${
          reasons.length > 0
            ? `
          <div style="background: white; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h3 style="color: #1e293b; margin: 0 0 15px 0;">Decision Reasons</h3>
            <ul style="margin: 0; padding-left: 20px;">
              ${reasons.map((reason) => `<li style="margin-bottom: 8px;">${reason}</li>`).join("")}
            </ul>
          </div>
        `
            : ""
        }

        <div style="background: #f1f5f9; padding: 15px; border-radius: 6px; font-size: 14px; color: #64748b;">
          <p style="margin: 0;">This is an automated notification from the Case Intake System.</p>
          <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// generate email text content
function generateEmailText(options: SendDecisionEmailOptions): string {
  const { decision, clientName, caseId, score, reasons } = options;

  const decisionText = {
    ACCEPT: "Accepted",
    REVIEW: "Under Review",
    DECLINE: "Declined",
  }[decision];

  let text = `Case Decision Notification\n\n`;
  text += `Client: ${clientName}\n`;
  text += `Case ID: ${caseId}\n`;
  text += `Decision: ${decisionText}\n`;
  text += `Score: ${score}/100\n\n`;

  if (reasons.length > 0) {
    text += `Decision Reasons:\n`;
    reasons.forEach((reason, index) => {
      text += `${index + 1}. ${reason}\n`;
    });
    text += `\n`;
  }

  text += `This is an automated notification from the Case Intake System.\n`;
  text += `Please do not reply to this email.`;

  return text;
}

// send decision email
export async function sendDecisionEmail(
  options: SendDecisionEmailOptions
): Promise<EmailResult> {
  const { to, decision, clientName, caseId, score } = options;
  const client = getResendClient();

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      logger.info("Sending decision email", {
        attempt,
        to,
        decision,
        clientName,
        caseId,
        score,
      });

      const fromEmail = process.env.RESEND_FROM_EMAIL;
      if (!fromEmail || fromEmail.trim() === "") {
        throw new Error("RESEND_FROM_EMAIL environment variable is required but not configured");
      }

      const result = await client.emails.send({
        from: fromEmail,
        to: [to],
        subject: getEmailSubject(decision, clientName),
        html: generateEmailHTML(options),
        text: generateEmailText(options),
      });

      if (result.error) {
        const errorMessage = result.error.message || result.error.name || "Unknown Resend API error";
        throw new Error(`Resend API error: ${errorMessage}`);
      }

      logger.info("Decision email sent successfully", {
        emailId: result.data?.id,
        to,
        decision,
        caseId,
      });

      return {
        id: result.data?.id || "unknown",
        success: true,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        logger.warn("Email send failed, retrying", {
          attempt,
          error: lastError.message,
          delayMs: delay,
        });
        await sleep(delay);
      } else {
        logger.error("Email send failed after all retries", {
          attempts: MAX_RETRIES,
          error: lastError.message,
          to,
          decision,
          caseId,
        });
      }
    }
  }

  // all retries failed
  throw new Error(
    `Email send failed after ${MAX_RETRIES} attempts: ${lastError?.message || "Unknown error"}`
  );
}
