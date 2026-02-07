import axios from "axios";
import moment from "moment-timezone";
import dotenv from "dotenv";
dotenv.config();

// --- CONFIGURATION ---
const ZOOM_TOKEN_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

const {
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_ACCOUNT_ID,
  ZOOM_USER_ID,
  ZOOM_TOKEN_CACHE_TTL = 3300, 
} = process.env;

// In-Memory Cache
let tokenCache = {
  access_token: null,
  expires_at: 0,
};

// --- HELPERS ---

/**
 * Get Server-to-Server OAuth Token
 * Grant Type: account_credentials
 */
async function fetchAccessToken() {
  // 1. Check Cache
  if (tokenCache.access_token && Date.now() < tokenCache.expires_at) {
    return tokenCache.access_token;
  }

  // 2. Prepare Credentials
  if (!ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET || !ZOOM_ACCOUNT_ID) {
    throw new Error("Missing Zoom API Credentials in .env");
  }

  const basicAuth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  
  const params = new URLSearchParams();
  params.append("grant_type", "account_credentials");
  params.append("account_id", ZOOM_ACCOUNT_ID);

  try {
    const { data } = await axios.post(ZOOM_TOKEN_URL, params.toString(), {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // 3. Update Cache
    tokenCache.access_token = data.access_token;
    // Expire 30 seconds early to avoid race conditions
    const ttlSeconds = data.expires_in || ZOOM_TOKEN_CACHE_TTL;
    tokenCache.expires_at = Date.now() + (ttlSeconds - 30) * 1000;

    return tokenCache.access_token;

  } catch (err) {
    console.error("Zoom Token Error:", err.response?.data || err.message);
    throw new Error("Failed to authenticate with Zoom");
  }
}

/**
 * Helper to make authenticated requests
 */
async function zoomRequest(method, endpoint, data = null) {
  const token = await fetchAccessToken();
  try {
    const response = await axios({
      method,
      url: `${ZOOM_API_BASE}${endpoint}`,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (err) {
    // 404 is often a valid "state" (e.g. deleting something that's gone)
    // We let the caller handle it or throw a standardized error
    const status = err.response?.status;
    const errorData = err.response?.data;
    
    // Attach status to error object for easy checking upstream
    const customError = new Error(errorData?.message || "Zoom API Error");
    customError.status = status;
    customError.details = errorData;
    throw customError;
  }
}

// --- EXPORTED SERVICES ---

/**
 * Create Meeting
 * @param {Object} sessionMeta 
 * { topic, start_time (ISO), duration (min), timezone, settings }
 */
export async function createMeeting(sessionMeta = {}) {
  const userId = ZOOM_USER_ID || "me";
  const timezone = sessionMeta.timezone || "Asia/Colombo";

  // Zoom requires "YYYY-MM-DDTHH:mm:ss" relative to the timezone provided.
  // We use moment-tz to strip the offset and send strict "Wall Time".
  let formattedStartTime;
  if (sessionMeta.start_time) {
      formattedStartTime = moment(sessionMeta.start_time).tz(timezone).format("YYYY-MM-DDTHH:mm:ss");
  }

  const body = {
    topic: sessionMeta.topic || "Class Session",
    type: 2, // Scheduled Meeting
    start_time: formattedStartTime, 
    duration: sessionMeta.duration || 120,
    timezone: timezone,
    settings: {
      host_video: true,
      participant_video: false,
      join_before_host: false,
      mute_upon_entry: true,
      waiting_room: false,
      auto_recording: "cloud", // Important for LMS
      approval_type: 2,        // 2 = No Registration Required
      ...sessionMeta.settings, // Allow override
    },
  };

  try {
    return await zoomRequest("POST", `/users/${encodeURIComponent(userId)}/meetings`, body);
  } catch (err) {
    console.error("Create Meeting Failed:", err.message);
    throw err; // Re-throw to controller
  }
}

/**
 * Delete Meeting
 */
export async function deleteMeeting(meetingId) {
  if (!meetingId) return true; // Already "deleted" if null
  try {
    await zoomRequest("DELETE", `/meetings/${encodeURIComponent(meetingId)}`);
    return true;
  } catch (err) {
    if (err.status === 404) return true; // Treat 404 as success (already deleted)
    console.error("Delete Meeting Failed:", err.message);
    throw err;
  }
}

/**
 * Update Meeting
 */
export async function updateMeeting(meetingId, payload) {
  if (!meetingId) throw new Error("Meeting ID required");
  
  // If updating time, ensure formatting matches Zoom requirement
  if (payload.start_time) {
     const tz = payload.timezone || "Asia/Colombo";
     payload.start_time = moment(payload.start_time).tz(tz).format("YYYY-MM-DDTHH:mm:ss");
  }

  try {
    await zoomRequest("PATCH", `/meetings/${encodeURIComponent(meetingId)}`, payload);
    return true;
  } catch (err) {
    console.error("Update Meeting Failed:", err.message);
    throw err;
  }
}