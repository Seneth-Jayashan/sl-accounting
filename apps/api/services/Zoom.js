// services/zoomService.js
import axios from "axios";
import qs from "qs";

const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

const {
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_ACCOUNT_ID,
  ZOOM_USER_ID,
  ZOOM_TOKEN_CACHE_TTL = 3500,
} = process.env;

// simple in-memory cache (replace with Redis if you run multiple instances)
let tokenCache = {
  access_token: null,
  expires_at: 0,
};

async function fetchAccessTokenServerToServer() {
  // If cached and not expired, return it
  if (tokenCache.access_token && Date.now() < tokenCache.expires_at) {
    return tokenCache.access_token;
  }

  // Server-to-Server OAuth token (account credentials grant)
  // Note: Zoom expects Basic auth with client_id:client_secret and grant_type=account_credentials (account_id param)
  // Some Zoom docs/examples show other variants; check your App type and docs if you created a different app.
  const basic = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString(
    "base64"
  );

  const params = new URLSearchParams();
  // grant_type for server-to-server is "account_credentials"
  params.append("grant_type", "account_credentials");
  if (ZOOM_ACCOUNT_ID) params.append("account_id", ZOOM_ACCOUNT_ID);

  try {
    const resp = await axios.post(`${ZOOM_TOKEN_URL}`, params.toString(), {
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = resp.data;
    // data.access_token, data.expires_in (seconds)
    tokenCache.access_token = data.access_token;
    tokenCache.expires_at =
      Date.now() + ((data.expires_in || ZOOM_TOKEN_CACHE_TTL) - 30) * 1000; // refresh 30s early
    return tokenCache.access_token;
  } catch (err) {
    console.error(
      "Zoom token fetch failed:",
      err.response?.data || err.message
    );
    throw new Error("Failed to get Zoom access token");
  }
}

/**
 * createMeeting(sessionMeta)
 * sessionMeta: {
 *   topic, start_time (ISO string), duration (minutes), timezone (e.g. "Asia/Colombo"), password (optional), settings: {}
 * }
 */
export async function createMeeting(sessionMeta = {}) {
  const accessToken = await fetchAccessTokenServerToServer();

  const userId = process.env.ZOOM_USER_ID;
  if (!userId) throw new Error("ZOOM_USER_ID not configured");

  const body = {
    topic: sessionMeta.topic || "Class Session",
    type: 2, // scheduled meeting
    start_time: sessionMeta.start_time, // ISO 8601
    duration: sessionMeta.duration || 120,
    timezone: sessionMeta.timezone || "UTC",
    password: sessionMeta.password || undefined,
    settings: sessionMeta.settings || {
      join_before_host: false,
      host_video: false,
      participant_video: false,
      approval_type: 0, // automatically accept
    },
  };

  try {
    const resp = await axios.post(
      `${ZOOM_API_BASE}/users/${encodeURIComponent(userId)}/meetings`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    // resp.data contains .id, .join_url, .start_url, etc.
    return resp.data;
  } catch (err) {
    console.error(
      "Zoom createMeeting error:",
      err.response?.data || err.message
    );
    throw new Error("Failed to create Zoom meeting");
  }
}

// inside services/zoomService.js (add near createMeeting)
export async function deleteMeeting(meetingId) {
  if (!meetingId) throw new Error("meetingId required");
  const accessToken = await fetchAccessTokenServerToServer();
  try {
    // Zoom expects meeting id as path param
    const resp = await axios.delete(
      `${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    // Zoom deletes return 204 No Content; return resp.status
    return resp.status === 204;
  } catch (err) {
    // If meeting is already deleted (404) we can treat as success
    const status = err?.response?.status;
    if (status === 404) {
      return true;
    }
    console.error(
      "Zoom deleteMeeting failed:",
      err?.response?.data || err.message
    );
    throw err;
  }
}


// services/zoomService.js (add)
export async function updateMeeting(meetingId, payload) {
  const accessToken = await fetchAccessTokenServerToServer();
  try {
    const resp = await axios.patch(`${ZOOM_API_BASE}/meetings/${encodeURIComponent(meetingId)}`, payload, {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }
    });
    return resp.data;
  } catch (err) {
    console.error("Zoom updateMeeting failed:", err?.response?.data || err.message);
    throw err;
  }
}
