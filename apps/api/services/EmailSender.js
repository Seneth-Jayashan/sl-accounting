import axios from "axios";
import "dotenv/config";

/**
 * Zoho Mailer service (ES module)
 *
 * Required env vars:
 * - ZOHO_REFRESH_TOKEN
 * - ZOHO_CLIENT_ID
 * - ZOHO_CLIENT_SECRET
 * - ZOHO_ACCOUNT_ID
 * - ZOHO_EMAIL            // the from email address
 * - ZOHO_OAUTH_DOMAIN     // optional, defaults to "https://accounts.zoho.com" (use accounts.zoho.eu for EU accounts)
 *
 * Notes:
 * - This implementation caches access token in memory. For multiple server instances, persist tokens in a shared store (Redis/DB).
 * - The code retries a single send after refreshing token if a 401/INVALID_OAUTHTOKEN occurs.
 */

const OAUTH_DOMAIN = process.env.ZOHO_OAUTH_DOMAIN || "https://accounts.zoho.com";
let accessToken = process.env.ZOHO_ACCESS_TOKEN || null; // optional pre-warmed token

/**
 * Refresh Zoho access token using refresh token
 */
export async function refreshAccessToken() {
  try {
    const resp = await axios.post(
      `${OAUTH_DOMAIN}/oauth/v2/token`,
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: "refresh_token",
        },
        timeout: 15000,
      }
    );

    if (!resp?.data?.access_token) {
      throw new Error("No access_token in Zoho response");
    }

    accessToken = resp.data.access_token;
    // Optionally: persist `accessToken` + expiry to DB/Redis here for shared instances
    console.info("[ZohoMailer] Access token refreshed");
    return accessToken;
  } catch (err) {
    const info = err.response?.data || err.message || err;
    console.error("[ZohoMailer] Failed to refresh access token:", info);
    throw err;
  }
}

/**
 * Build payload expected by Zoho Mail API.
 * Accepts `to` as string or array of strings.
 */
function buildPayload({ to, subject, text, html, fromName }) {
  const toAddress = Array.isArray(to) ? to.join(",") : to;
  const content = html ?? text ?? "";

  return {
    fromAddress: `${fromName || "SL Accounting"} <${process.env.ZOHO_EMAIL}>`,
    toAddress,
    subject,
    content,
    askReceipt: "no",
    // You can add ccAddress, bccAddress, replyToAddress, attachments (multipart) etc if needed
  };
}

/**
 * Send email via Zoho Mail API.
 * Retries once after token refresh if token is invalid/expired.
 *
 * Params:
 * - to (string | string[])
 * - subject (string)
 * - text (string) optional
 * - html (string) optional
 * - fromName (string) optional
 */
export async function sendEmail({ to, subject, text = "", html = null, fromName = "SL Accounting" }) {
  // Ensure presence of token (try refresh if not present)
  if (!accessToken) {
    try {
      await refreshAccessToken();
    } catch (err) {
      console.error("[ZohoMailer] Unable to obtain access token prior to send");
      throw err;
    }
  }

  const payload = buildPayload({ to, subject, text, html, fromName });

  const url = `https://mail.zoho.com/api/accounts/${process.env.ZOHO_ACCOUNT_ID}/messages`;

  const headers = {
    Authorization: `Zoho-oauthtoken ${accessToken}`,
    "Content-Type": "application/json",
  };

  try {
    const resp = await axios.post(url, payload, { headers, timeout: 20000 });
    console.info("[ZohoMailer] Email sent", { status: resp.status });
    return resp.data;
  } catch (err) {
    const status = err.response?.status;
    const body = err.response?.data;
    const code = body?.data?.errorCode;

    // If token-related, refresh once and retry
    const invalidToken = status === 401 || code === "INVALID_OAUTHTOKEN" || code === "INVALID_TOKEN";

    if (invalidToken) {
      console.warn("[ZohoMailer] Access token invalid/expired — refreshing and retrying once");
      try {
        await refreshAccessToken();
      } catch (refreshErr) {
        console.error("[ZohoMailer] Refresh failed during retry attempt", refreshErr.response?.data || refreshErr.message || refreshErr);
        throw refreshErr;
      }

      // Update header and retry once
      try {
        const retryResp = await axios.post(url, payload, {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 20000,
        });
        console.info("[ZohoMailer] Email sent on retry", { status: retryResp.status });
        return retryResp.data;
      } catch (retryErr) {
        console.error("[ZohoMailer] Retry after refresh failed:", retryErr.response?.data || retryErr.message || retryErr);
        throw retryErr;
      }
    }

    // Non-token error: surface it
    console.error("[ZohoMailer] Error sending email:", body || err.message || err);
    throw err;
  }
}

/**
 * Optional convenience default export
 */
export default {
  refreshAccessToken,
  sendEmail,
};
