import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { google } from 'googleapis';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import Session from '../models/Session.js';
import User from '../models/User.js';

// --- CONFIGURATION ---
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Credentials
const {
  ZOOM_WEBHOOK_SECRET,
  ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  YOUTUBE_CLIENT_ID,
  YOUTUBE_CLIENT_SECRET,
  YOUTUBE_REFRESH_TOKEN
} = process.env;

// ==========================================
// 1. MAIN WEBHOOK HANDLER
// ==========================================
export const handleWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;

    // A. ZOOM ENDPOINT VALIDATION (Required to activate webhook)
    if (payload && payload.plainToken) {
      console.log('🔍 Zoom Webhook Validation Requested');
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

    // B. RECORDING COMPLETED EVENT
    if (event === 'recording.completed') {
      console.log(`📹 Event Received: Recording Completed (${payload.object.id})`);
      
      // IMPORTANT: Respond 200 OK immediately to prevent Zoom timeout/retries
      res.status(200).send('Event received'); 

      // Trigger background processing (Fire & Forget)
      processRecording(payload.object).catch(err => 
        console.error("Background Processing Failed:", err.message)
      );
      return;
    }

    // D. PARTICIPANT JOINED EVENT
    if (event === 'meeting.participant_joined') {
      console.log(`👤 Event Received: Participant Joined`);
      
      // Respond immediately
      res.status(200).send('Event received'); 

      // Process attendance marking (Fire & Forget)
      handleParticipantJoined(payload.object).catch(err => 
        console.error("Attendance Join Processing Failed:", err.message)
      );
      return;
    }

    // E. PARTICIPANT LEFT EVENT
    if (event === 'meeting.participant_left') {
      console.log(`👤 Event Received: Participant Left`);
      
      // Respond immediately
      res.status(200).send('Event received'); 

      // Process attendance marking (Fire & Forget)
      handleParticipantLeft(payload.object).catch(err => 
        console.error("Attendance Leave Processing Failed:", err.message)
      );
      return;
    }

    // C. IGNORE OTHERS
    res.status(200).send('Event ignored');

  } catch (error) {
    console.error('Webhook Handler Error:', error);
    res.status(500).send('Server Error');
  }
};

// ==========================================
// 2. BACKGROUND WORKER LOGIC
// ==========================================

async function processRecording(recordingObject) {
  const meetingId = String(recordingObject.id);
  // Default topic fallback if Zoom doesn't send one
  const topic = recordingObject.topic || `Class Recording ${meetingId}`;
  
  console.log(`\n--- ⏳ PROCESSING MEETING: ${meetingId} ---`);

  try {
    // 1. Validate Session exists in DB
    const session = await Session.findOne({ zoomMeetingId: meetingId });
    if (!session) {
      console.log(`⚠️ Skipping: No Session found in DB for Zoom ID ${meetingId}`);
      return;
    }

    // 2. Get Fresh Zoom Access Token (Server-to-Server)
    console.log("🔑 Generatng Zoom Token...");
    const accessToken = await getZoomAccessToken();

    // 3. Fetch Recording Details from API
    // (We use the API instead of the webhook payload because download_urls in the webhook 
    // often lack the permissions required for 3rd party downloaders)
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
        return;
    }

    // 4. Find the largest MP4 file
    const videoFiles = apiResponse.data.recording_files.filter(f => f.file_type === 'MP4');
    
    if (videoFiles.length === 0) {
      console.log('⚠️ No MP4 files found in API response.');
      return;
    }

    // Sort by size desc
    const bestFile = videoFiles.sort((a, b) => (b.file_size || 0) - (a.file_size || 0))[0];
    
    const downloadUrl = bestFile.download_url;
    const tempFilePath = path.join(__dirname, '../temp', `${meetingId}.mp4`);

    console.log(`✅ File Found: ${bestFile.recording_type} (${(bestFile.file_size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`⬇️ Starting Download to ${tempFilePath}...`);

    // 5. Download File
    await downloadFile(downloadUrl, tempFilePath, accessToken);
    console.log('✅ Download Complete.');

    // 6. Upload to YouTube
    console.log('🚀 Uploading to YouTube...');
    const youtubeVideoId = await uploadToYouTube(tempFilePath, topic);
    
    // 7. Update Database
    session.youtubeVideoId = youtubeVideoId;
    session.recordingTitle = topic;
    session.recordingShared = true; // Mark as available
    await session.save();

    console.log(`🎉 SUCCESS: Session ${session._id} updated with YouTube ID ${youtubeVideoId}`);

    // 8. Cleanup Temp File
    cleanupFile(tempFilePath);

  } catch (err) {
    console.error('❌ FATAL ERROR in processRecording:', err.message);
    if (err.response) {
        console.error('API Error Details:', err.response.data);
    }
  }
}

// ==========================================
// 2B. ATTENDANCE HANDLERS (Participant Join/Leave)
// ==========================================

async function handleParticipantJoined(meetingObject) {
  try {
    const meetingId = String(meetingObject.id);
    const participant = meetingObject.participant;

    if (!participant || !participant.user_id) {
      console.log('⚠️ Invalid participant data');
      return;
    }

    console.log(`\n--- 👤 PARTICIPANT JOINED: ${participant.user_id} (${participant.name}) ---`);

    // 1. Find Session by Zoom Meeting ID
    const session = await Session.findOne({ zoomMeetingId: meetingId });
    if (!session) {
      console.log(`⚠️ No Session found for Zoom Meeting ${meetingId}`);
      return;
    }

    // 2. Map Zoom user ID to our Student ID
    // Zoom sends user_id; we need to find our User model that has zoomUserId or email match
    let student = null;
    
    // Try to find by Zoom user ID first (if we store it)
    student = await User.findOne({ zoomUserId: participant.user_id });
    
    // If not found, try by email
    if (!student && participant.email) {
      student = await User.findOne({ email: participant.email });
    }

    if (!student) {
      console.log(`⚠️ Could not map Zoom user ${participant.user_id} to Student`);
      return;
    }

    // 3. Check if already marked as present for this session
    const alreadyPresent = (session.attendance || []).some(
      a => a.student.toString() === student._id.toString()
    );

    if (!alreadyPresent) {
      console.log(`✅ Recording attendance for ${student.firstName} ${student.lastName}`);
      await session.markAttendanceStart(student._id);
    } else {
      console.log(`ℹ️ Student already marked present for this session`);
    }

  } catch (error) {
    console.error('❌ Error in handleParticipantJoined:', error.message);
  }
}

async function handleParticipantLeft(meetingObject) {
  try {
    const meetingId = String(meetingObject.id);
    const participant = meetingObject.participant;

    if (!participant || !participant.user_id) {
      console.log('⚠️ Invalid participant data');
      return;
    }

    console.log(`\n--- 🚪 PARTICIPANT LEFT: ${participant.user_id} ---`);

    // 1. Find Session by Zoom Meeting ID
    const session = await Session.findOne({ zoomMeetingId: meetingId });
    if (!session) {
      console.log(`⚠️ No Session found for Zoom Meeting ${meetingId}`);
      return;
    }

    // 2. Map Zoom user ID to our Student ID
    let student = null;
    student = await User.findOne({ zoomUserId: participant.user_id });
    if (!student && participant.email) {
      student = await User.findOne({ email: participant.email });
    }

    if (!student) {
      console.log(`⚠️ Could not map Zoom user ${participant.user_id} to Student`);
      return;
    }

    // 3. Mark attendance end time
    console.log(`✅ Recording departure for ${student.firstName} ${student.lastName}`);
    await session.markAttendanceEnd(student._id);

  } catch (error) {
    console.error('❌ Error in handleParticipantLeft:', error.message);
  }
}

// ==========================================
// 3. HELPER FUNCTIONS
// ==========================================

async function getZoomAccessToken() {
    const authHeader = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');
    
    const params = new URLSearchParams();
    params.append('grant_type', 'account_credentials');
    params.append('account_id', ZOOM_ACCOUNT_ID);

    try {
        const response = await axios.post(
            `https://zoom.us/oauth/token`,
            params,
            {
                headers: {
                    Authorization: `Basic ${authHeader}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            }
        );
        return response.data.access_token;
    } catch (error) {
        console.error("Zoom Auth Error:", error.response ? error.response.data : error.message);
        throw new Error("Could not authenticate with Zoom.");
    }
}

async function downloadFile(url, destPath, token) {
  // Ensure temp folder exists
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Append token to URL as query param
  const authenticatedUrl = `${url}?access_token=${token}`;

  const response = await axios({
    method: 'GET',
    url: authenticatedUrl,
    responseType: 'stream',
    // CRITICAL: Do NOT send Authorization header. AWS S3 will reject it.
    headers: { 'Accept': '*/*' } 
  });

  const writer = fs.createWriteStream(destPath);
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', (err) => {
        // Close stream on error before rejecting
        writer.close(); 
        reject(err);
    });
  });
}

async function uploadToYouTube(filePath, title) {
  const oauth2Client = new google.auth.OAuth2(
    YOUTUBE_CLIENT_ID,
    YOUTUBE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URI must match Cloud Console
  );

  oauth2Client.setCredentials({ 
    refresh_token: YOUTUBE_REFRESH_TOKEN 
  });

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client,
  });

  // Upload
  const res = await youtube.videos.insert({
    part: 'snippet,status',
    requestBody: {
      snippet: {
        title: title.substring(0, 100), // YouTube max title length
        description: 'Auto-uploaded via LMS System',
      },
      status: {
        privacyStatus: 'unlisted', // 'private', 'public', or 'unlisted'
      },
    },
    media: {
      body: fs.createReadStream(filePath),
    },
  });

  return res.data.id;
}

function cleanupFile(filePath) {
    try {
       if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (e) {
       console.error('Cleanup warning:', e.message);
    }
}