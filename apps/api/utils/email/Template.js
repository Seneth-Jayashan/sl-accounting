// services/EmailTemplates.js
import Email from "../../services/EmailSender.js";

// --- Configuration ---
// Best practice: Load these from process.env in a real app
const CLIENT_URL = process.env.CLIENT_URL || "https://app.slaccounting.example";
const ASSET_URL = process.env.ASSET_URL || "https://example.com"; // For hosting logos

const BRAND = {
  name: "SL Accounting",
  color: "#0B5FFF", // Primary brand color
  logo: `${ASSET_URL}/logo.png`,
  supportEmail: "support@slaccounting.example",
  address: "SL Accounting, Colombo, Sri Lanka"
};

/* ---------- Helpers ---------- */

/**
 * Escapes unsafe characters to prevent XSS in HTML body context.
 */
const escapeHtml = (unsafe) => {
  if (unsafe == null) return "";
  return String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

/**
 * Escapes unsafe characters for HTML attributes.
 */
const escapeAttr = (unsafe) => {
  if (unsafe == null) return "";
  return String(unsafe)
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;"); // &apos; is not fully supported in all email clients
};

/**
 * Ensures URLs use http/https to prevent 'javascript:' injection attacks.
 * Returns '#' if the URL is invalid or unsafe.
 */
const sanitizeUrl = (url) => {
  if (!url) return "#";
  const lower = url.trim().toLowerCase();
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) {
    return escapeAttr(url);
  }
  return "#"; // Block unsafe protocols
};

/* ---------- Layout Builder ---------- */

const buildHtmlLayout = ({ preheader = "", title = "", introHtml = "", cta = null, footerHtml = "" }) => {
  // cta format: { text: "Click Me", url: "https://..." }
  
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    body { margin:0; padding:0; -webkit-text-size-adjust:100%; background-color:#f4f6fb; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; display:block; }
    a { color: ${BRAND.color}; text-decoration: none; font-weight: 600; }
    .container { width:100%; max-width:600px; margin:0 auto; }
    .card { background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }
    .header-pad { padding: 32px 32px 24px 32px; text-align: center; }
    .content-pad { padding: 0 32px 32px 32px; }
    .title { font-size:24px; font-weight:700; color:#1f2937; margin:0 0 16px 0; letter-spacing: -0.5px; text-align: center; }
    .body-text { font-size:16px; color:#4b5563; line-height:1.6; margin:0 0 20px 0; text-align: left; }
    .cta-button { display:inline-block; padding:14px 32px; border-radius:6px; background-color:${BRAND.color}; color:#ffffff !important; font-weight:700; text-decoration:none; font-size: 16px; }
    .hr { border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0; }
    .footer { font-size:12px; color:#9ca3af; text-align:center; padding-bottom: 32px; }
    .small { font-size:13px; color:#6b7280; font-style: italic; }
    
    @media (max-width:480px) {
      .header-pad { padding: 24px 20px 16px 20px; }
      .content-pad { padding: 0 20px 24px 20px; }
      .title { font-size: 20px; }
      .body-text { font-size: 15px; }
    }
  </style>
</head>
<body>
  <span class="preheader">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6fb; min-height: 100vh;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0">
          <tr>
            <td class="card">
              
              <div class="header-pad">
                <img src="${escapeAttr(BRAND.logo)}" alt="${escapeAttr(BRAND.name)}" width="150" style="max-width:150px; margin: 0 auto;">
              </div>

              <div class="content-pad">
                <h1 class="title">${escapeHtml(title)}</h1>
                
                <div class="body-text">
                  ${introHtml}
                </div>

                ${cta && cta.url ? `
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${sanitizeUrl(cta.url)}" class="cta-button" target="_blank" rel="noopener noreferrer">${escapeHtml(cta.text)}</a>
                  </div>
                ` : ""}

                ${footerHtml ? `<div style="text-align: center; margin-top: 24px;" class="small">${footerHtml}</div>` : ""}

                <hr class="hr">

                <div class="footer">
                  <p style="margin: 0 0 8px 0;">Need help? Contact <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a></p>
                  <p style="margin: 0;">${escapeHtml(BRAND.address)}</p>
                </div>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
};

/* ---------- Templates ---------- */

/**
 * Sends a test email. Refactored to return Promise like other services.
 * Usage in controller: 
 * await EmailTemplates.sendTestEmail("admin@example.com");
 */
export const sendTestEmail = async (to) => {
  const preheader = "Test email from SL Accounting — verify email sending.";
  
  // Safe injection of 'to' variable
  const introHtml = `
    <p class="body-text">This email verifies that your email delivery service is correctly configured. If you are reading this, the system is operational.</p>
    <p class="body-text" style="background:#f3f4f6; padding: 12px; border-radius: 4px; font-family: monospace;"><strong>Recipient ID:</strong> ${escapeHtml(to)}</p>
  `;

  const html = buildHtmlLayout({
    preheader,
    title: "System Test Email",
    introHtml,
    footerHtml: "You can delete this email safely."
  });

  const text = `SL Accounting — Test Email\n\nSystem operational.\nRecipient: ${to}`;

  return Email.sendEmail({
    to,
    subject: "Test Email from SL Accounting",
    html,
    text
  });
};

/**
 * Sends OTP Verification code.
 */
export const sendVerificationEmail = async (to, otpCode) => {
  const ttlMinutes = 10;
  const preheader = `${otpCode} is your verification code.`;

  const html = buildHtmlLayout({
    preheader,
    title: "Verify your email",
    introHtml: `
      <p class="body-text">
        Thank you for registering with <strong>${escapeHtml(BRAND.name)}</strong>. Please use the verification code below to complete your sign-up.
      </p>
      <div style="text-align:center; margin: 32px 0;">
        <span style="font-size:36px; font-weight:800; letter-spacing:6px; color:#1f2937; background:#f3f4f6; padding: 16px 32px; border-radius: 8px; display: inline-block; border: 1px dashed #d1d5db;">
          ${escapeHtml(otpCode)}
        </span>
      </div>
      <p class="body-text" style="text-align: center;">
        This code will expire in ${ttlMinutes} minutes.
      </p>
    `,
    footerHtml: "If you did not create an account, please ignore this message."
  });

  const text = `Your verification code is: ${otpCode}\n\nExpires in ${ttlMinutes} minutes.`;

  return Email.sendEmail({
    to,
    subject: "Verify Your Email - SL Accounting",
    html,
    text
  });
};

/**
 * Sends Password Reset Link.
 */
export const sendPasswordResetEmail = async (to, resetLink) => {
  const preheader = "Reset instructions for your SL Accounting account.";
  
  const html = buildHtmlLayout({
    preheader,
    title: "Reset Password Request",
    introHtml: `
      <p class="body-text">We received a request to reset the password for your account. Click the button below to choose a new secure password.</p>
      <p class="body-text">This link is valid for <strong>1 hour</strong>.</p>
    `,
    cta: { text: "Reset My Password", url: resetLink },
    footerHtml: "If you did not request a password reset, you can safely ignore this email. Your account remains secure."
  });

  const text = `Reset your password here: ${resetLink}\n\nIgnore if you did not request this.`;

  return Email.sendEmail({ 
    to, 
    subject: "Reset Your Password", 
    html, 
    text 
  });
};

/**
 * Sends generic notifications.
 */
export const sendNotificationEmail = async (to, message, subject = "Notification from SL Accounting") => {
  const preheader = "You have a new notification.";
  
  // Allow line breaks in plain text messages to render in HTML
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");

  const html = buildHtmlLayout({
    preheader,
    title: "New Notification",
    introHtml: `<p class="body-text">${safeMessage}</p>`,
    footerHtml: "This is an automated notification."
  });

  return Email.sendEmail({ to, subject, html, text: message });
};

/**
 * Sends Welcome Email.
 */
export const sendWelcomeEmail = async (to, name) => {
  const preheader = "Welcome to SL Accounting! Let's get you started.";
  const dashboardUrl = `${CLIENT_URL}/dashboard`;

  const html = buildHtmlLayout({
    preheader,
    title: `Welcome, ${escapeHtml(name)}!`,
    introHtml: `
      <p class="body-text">We are excited to have you on board with <strong>${escapeHtml(BRAND.name)}</strong>.</p>
      <p class="body-text">You now have access to our student portal where you can manage your classes, view payments, and access learning materials.</p>
    `,
    cta: { text: "Go to Dashboard", url: dashboardUrl },
    footerHtml: `Need assistance? Reply to this email.`
  });

  const text = `Welcome to ${BRAND.name}, ${name}!\n\nAccess your dashboard: ${dashboardUrl}`;

  return Email.sendEmail({ 
    to, 
    subject: "Welcome to SL Accounting!", 
    html, 
    text 
  });
};