// services/EmailTemplates.js
import Email from "../../services/EmailSender.js";

/**
 * Build the full HTML layout for emails.
 * Customize the brand variables below.
 */
const BRAND = {
  name: "SL Accounting",
  color: "#0B5FFF", // primary color used for CTA/button
  logo: "https://example.com/logo.png", // replace with your hosted logo
  supportEmail: "support@slaccounting.example", // support address
  address: "SL Accounting, Colombo, Sri Lanka"
};

const buildHtmlLayout = ({ preheader = "", title = "", introHtml = "", cta = null, footerHtml = "" }) => {
  // cta: { text, url } or null
  // Keep CSS mostly inline for email client compatibility
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    /* General reset */
    body { margin:0; padding:0; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; background:#f4f6fb; }
    table { border-collapse:collapse; }
    img { border:0; height:auto; line-height:100%; outline:none; text-decoration:none; display:block; }
    a { color: ${BRAND.color}; text-decoration: none; }
    .container { width:100%; max-width:680px; margin:0 auto; }
    .card { background:#ffffff; border-radius:10px; padding:28px; box-shadow: 0 4px 18px rgba(12,21,48,0.06); }
    .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; }
    .header { text-align:left; padding-bottom:18px; }
    .title { font-size:20px; font-weight:600; color:#0f1724; margin:0 0 8px 0; }
    .hr { height:1px; background:#eef2ff; border:none; margin:18px 0; }
    .body-text { font-size:15px; color:#26314a; line-height:1.65; margin:0 0 18px 0; }
    .cta { display:inline-block; padding:12px 20px; border-radius:8px; background:${BRAND.color}; color:#ffffff; font-weight:600; text-decoration:none; }
    .footer { font-size:13px; color:#6b7280; text-align:center; padding-top:18px; }
    .small { font-size:13px; color:#6b7280; }
    @media (max-width:480px) {
      .card { padding:18px; border-radius:8px; }
      .title { font-size:18px; }
    }
  </style>
</head>
<body>
  <span class="preheader">${escapeHtml(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:28px 16px;">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0">
          <tr>
            <td class="card">
              <!-- Header -->
              <table role="presentation" width="100%">
                <tr>
                  <td style="vertical-align:middle;" class="header">
                    <img src="${BRAND.logo}" alt="${BRAND.name} logo" width="140" style="max-width:140px;">
                  </td>
                </tr>
              </table>

              <!-- Content -->
              <h1 class="title">${escapeHtml(title)}</h1>
              <div class="body-text">
                ${introHtml}
              </div>

              ${cta && cta.url ? `
                <p style="margin: 18px 0;">
                  <a href="${escapeAttr(cta.url)}" class="cta" target="_blank" rel="noopener noreferrer">${escapeHtml(cta.text)}</a>
                </p>
              ` : ""}

              ${footerHtml ? `<div class="small" style="margin-top:12px;">${footerHtml}</div>` : ""}

              <hr class="hr">

              <div class="footer">
                <div>Questions? Email <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a></div>
                <div style="margin-top:8px;">${BRAND.address}</div>
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

/* ---------- helpers ---------- */
const escapeHtml = (unsafe = "") =>
  String(unsafe)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const escapeAttr = (unsafe = "") =>
  String(unsafe).replaceAll('"', "%22").replaceAll("'", "%27");

/* ---------- templates ---------- */

export const sendTestEmail = async (req, res) => {
  const { to } = req.body;
  try {
    const preheader = "Test email from SL Accounting — verify email sending.";
    const html = buildHtmlLayout({
      preheader,
      title: "Test Email — SL Accounting",
      introHtml: `<p class="body-text">This email verifies that our email delivery is working correctly. If you received this, everything is set up!</p>
                  <p class="body-text"><strong>Recipient:</strong> ${escapeHtml(to)}</p>`,
      footerHtml: "If you didn't expect this email, please ignore it."
    });

    const text = `SL Accounting — Test Email\n\nThis verifies email delivery.\nRecipient: ${to}\n\nIf you didn't expect this, ignore this message.`;

    const emailResponse = await Email.sendEmail({
      to,
      subject: "Test Email from SL Accounting",
      html,
      text
    });
    return res.status(200).json({ success: true, message: "Test email sent", data: emailResponse });
  } catch (error) {
    console.error("Send Test Email Error:", error);
    return res.status(500).json({ success: false, message: "Failed to send test email" });
  }
};

export const sendVerificationEmail = async (to, otpCode) => {
  const ttlMinutes = 10; // or your chosen expiry time

  const preheader = `Your ${BRAND.name} verification code`;
  const subject = "Verify Your Email for SL Accounting";

  const html = buildHtmlLayout({
    preheader,
    title: "Verify your email address",
    introHtml: `
      <p class="body-text">
        Thank you for registering with ${BRAND.name}. Use the verification code below to verify your email address.
      </p>

      <div style="
        text-align:center;
        font-size:32px;
        font-weight:700;
        letter-spacing:8px;
        color:#000;
        margin: 20px 0;
      ">
        ${escapeHtml(otpCode)}
      </div>

      <p class="body-text">
        This code will expire in ${ttlMinutes} minutes.
      </p>
    `,
    footerHtml: `
      <p class="small">
        If you did not request this code, you can safely ignore this email.
      </p>
    `
  });

  const text = `
Your ${BRAND.name} verification code is: ${otpCode}

This code expires in ${ttlMinutes} minutes.
If you did not request this, ignore this email.
  `.trim();

  return Email.sendEmail({
    to,
    subject,
    html,
    text
  });
};

export const sendPasswordResetEmail = async (to, resetLink) => {
  const preheader = "Password reset instructions for your SL Accounting account.";
  const html = buildHtmlLayout({
    preheader,
    title: "Reset your password",
    introHtml: `<p class="body-text">We received a request to reset your password. Click the button below to set a new secure password. This link expires in 1 hour.</p>`,
    cta: { text: "Reset my password", url: resetLink },
    footerHtml: `<p class="small">If you didn't request a password reset, you can safely ignore this email. Someone may have entered your email by mistake.</p>`
  });

  const text = `Password reset for ${BRAND.name}.\n\nOpen this link to reset your password: ${resetLink}\n\nIf you didn't request this, ignore this email.`;

  return Email.sendEmail({ to, subject: "Reset Your Password for SL Accounting", html, text });
};

export const sendNotificationEmail = async (to, message, subject = "Notification from SL Accounting") => {
  const preheader = "A new notification from SL Accounting.";
  const safeMessage = escapeHtml(message).replaceAll("\n", "<br>");
  const html = buildHtmlLayout({
    preheader,
    title: "New notification",
    introHtml: `<p class="body-text">${safeMessage}</p>`,
    footerHtml: `<p class="small">This is an automated message from ${BRAND.name}.</p>`
  });

  const text = `Notification from ${BRAND.name}:\n\n${message}`;

  return Email.sendEmail({ to, subject, html, text });
};

export const sendWelcomeEmail = async (to, name) => {
  const preheader = `Welcome to ${BRAND.name}! Get started with your account.`;
  const html = buildHtmlLayout({
    preheader,
    title: `Welcome to ${BRAND.name}, ${escapeHtml(name)}!`,
    introHtml: `<p class="body-text">Hi ${escapeHtml(name)},</p>
                <p class="body-text">Welcome to ${BRAND.name}! We're excited to have you on board. Here are some quick links to get started:</p>
                <ul style="padding-left:18px; margin:0 0 12px 0;">
                  <li style="margin-bottom:6px;">Go to your dashboard to view classes and invoices.</li>
                  <li style="margin-bottom:6px;">Update your profile and notification preferences.</li>
                  <li style="margin-bottom:6px;">Contact our support if you need help.</li>
                </ul>`,
    cta: { text: "Open my dashboard", url: "https://app.slaccounting.example/dashboard" },
    footerHtml: `<p class="small">We are here to help — reply to this email or contact support at <a href="mailto:${BRAND.supportEmail}">${BRAND.supportEmail}</a>.</p>`
  });

  const text = `Welcome to ${BRAND.name}, ${name}!\n\nVisit: https://app.slaccounting.example/dashboard\n\nIf you have questions, contact ${BRAND.supportEmail}.`;

  return Email.sendEmail({ to, subject: "Welcome to SL Accounting!", html, text });
};

/* Exported utility (optional): generate a plain HTML preview for dev */
export const previewTemplateHtml = (type, params = {}) => {
  switch (type) {
    case "welcome": return buildHtmlLayout({
      preheader: "Welcome preview",
      title: "Welcome Preview",
      introHtml: `<p class="body-text">Preview</p>`,
      cta: { text: "CTA", url: "#" }
    });
    default: return buildHtmlLayout({ title: "Preview", introHtml: "<p class='body-text'>Preview</p>" });
  }
};
