import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import Session from '../models/Session.js';

// Initialize Environment Variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ==========================================
// CONFIGURATION
// ==========================================
const ZOOM_WEBHOOK_SECRET = process.env.ZOOM_WEBHOOK_SECRET;

// ZOOM SERVER-TO-SERVER OAUTH CREDENTIALS (REQUIRED for downloading)
const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;

// ==========================================
// MAIN WEBHOOK HANDLER
// ==========================================
export const handleWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    // 1. ZOOM URL VALIDATION
    if (payload && payload.plainToken) {
      console.log('Received Validation Request');
      const plainToken = payload.plainToken;
      const encryptedToken = crypto
        .createHmac('sha256', ZOOM_WEBHOOK_SECRET)
        .update(plainToken)
        .digest('hex');

      return res.status(200).json({
        plainToken: plainToken,
        encryptedToken: encryptedToken,
      });
    }

    // 2. HANDLE RECORDING COMPLETED
    if (event === 'recording.completed') {
      console.log('Event: Recording Completed');
      res.status(200).send('Event received'); // Prevent Zoom Timeout

      // Trigger background process
      processRecording(payload.object);
      return;
    }

    res.status(200).send('Event ignored');

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Server Error');
  }
};

// ==========================================
// BACKGROUND WORKER FUNCTIONS
// ==========================================

// ==========================================
// BACKGROUND WORKER FUNCTIONS
// ==========================================

async function processRecording(recordingObject) {
  const meetingId = String(recordingObject.id);
  const topic = recordingObject.topic || `Class Recording ${meetingId}`;
  
  console.log(`\n--- PROCESSING MEETING: ${meetingId} ---`);

  try {
    // 1. Validate Session exists in DB
    const session = await Session.findOne({ zoomMeetingId: meetingId });
    if (!session) {
      console.log(`⚠️ Skipping: No Session found in DB for Zoom ID ${meetingId}`);
      return;
    }

    // 2. Get Zoom Access Token
    console.log("🔑 Generatng Zoom Token...");
    const accessToken = await getZoomAccessToken();

    // 3. FETCH RECORDING DETAILS VIA API (More reliable than Webhook payload)
    // This step fixes the 401 error by getting a fresh, Admin-level download URL
    console.log("📡 Fetching recording details from Zoom API...");
    let apiResponse;
    try {
        apiResponse = await axios.get(
            `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
    } catch (apiErr) {
        console.error("❌ SCOPE ERROR: Could not fetch recording details.");
        console.error("👉 Error:", apiErr.response?.data || apiErr.message);
        console.error("👉 ACTION: Go to Zoom Marketplace > Scopes. Add 'cloud_recording:read:recording:admin'. Re-install App.");
        return;
    }

    // 4. Find the largest MP4 file from the API response
    const videoFiles = apiResponse.data.recording_files.filter(f => f.file_type === 'MP4');
    
    if (videoFiles.length === 0) {
      console.log('⚠️ No MP4 files found in API response.');
      return;
    }

    // Sort by file_size descending (Largest is the main recording)
    const bestFile = videoFiles.sort((a, b) => (b.file_size || 0) - (a.file_size || 0))[0];
    
    const downloadUrl = bestFile.download_url;
    const tempFilePath = path.join(__dirname, '../temp', `${meetingId}.mp4`);

    console.log(`✅ File Found: ${bestFile.recording_type} (${(bestFile.file_size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`⬇️ Starting Download...`);

    // 5. Download (Using the API URL + Token Query Param)
    await downloadFile(downloadUrl, tempFilePath, accessToken);
    console.log('✅ Download Complete.');

    // 6. Upload to YouTube
    console.log('🚀 Uploading to YouTube...');
    const youtubeVideoId = await uploadToYouTube(tempFilePath, topic);
    
    // 7. Update Database
    session.youtubeVideoId = youtubeVideoId;
    session.recordingShared = true;
    await session.save();

    console.log(`🎉 SUCCESS: Session ${session._id} updated with YouTube ID ${youtubeVideoId}`);

    // 8. Cleanup
    try {
       if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    } catch (e) {
       console.error('Cleanup warning:', e.message);
    }

  } catch (err) {
    console.error('❌ FATAL ERROR:', err.message);
    if (err.response) {
        console.error('API Error Details:', err.response.data);
    }
  }
}

// Helper: Get Fresh Server-to-Server OAuth Token
async function getZoomAccessToken() {
    try {
        const authHeader = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
        const response = await axios.post(
            `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
            {},
            {
                headers: {
                    Authorization: `Basic ${authHeader}`,
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Error getting Zoom Access Token:", error.response ? error.response.data : error.message);
        throw new Error("Could not authenticate with Zoom.");
    }
}

async function downloadFile(url, destPath, token) {
  // Ensure temp folder exists
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log("Downloading file...");

  // 1. Append token to URL (Fixes AWS S3 redirect issue)
  const authenticatedUrl = `${url}?access_token=${token}`;

  const response = await axios({
    method: 'GET',
    url: authenticatedUrl,
    responseType: 'stream',
    // 2. CRITICAL: Do NOT send Authorization header here.
    // It causes S3 to reject the request.
    headers: {
      'Accept': '*/*' 
    }
  });

  const writer = fs.createWriteStream(destPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function uploadToYouTube(filePath, title) {
  const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({ 
    refresh_token: YOUTUBE_REFRESH_TOKEN 
  });

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: title,
        description: 'Auto-uploaded via SL Accounting LMS',
      },
      status: {
        privacyStatus: 'unlisted',
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  return res.data.id;
}