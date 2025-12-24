import fs from 'fs';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';

// 1. Load Environment Variables
dotenv.config();

// 2. Configuration
const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.YOUTUBE_REFRESH_TOKEN;
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'; 

// The name of your real video file in the root folder
const FILE_NAME = 'test_video_payload.mp4'; 

console.log("--- STARTING REAL VIDEO UPLOAD TEST ---");

async function testUpload() {
  // Check if env vars are loaded
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    console.error("❌ ERROR: Missing .env variables. Check YOUTUBE_CLIENT_ID, SECRET, or REFRESH_TOKEN.");
    return;
  }

  // Check if the video file actually exists
  if (!fs.existsSync(FILE_NAME)) {
    console.error(`❌ ERROR: Could not find file "${FILE_NAME}"`);
    console.error(`👉 Please make sure "${FILE_NAME}" is in the same folder as this script.`);
    return;
  }

  try {
    // 3. Setup Auth
    const oauth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );

    oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    console.log(`🚀 Found "${FILE_NAME}". Authenticating and uploading to YouTube...`);

    // 4. Upload Request
    const res = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: 'Real Video Test ' + new Date().toISOString(),
          description: 'This is a real video file upload test from the SL Accounting LMS dev environment.',
        },
        status: {
          privacyStatus: 'unlisted', // Keeps it private so no one sees your test
        },
      },
      media: {
        body: fs.createReadStream(FILE_NAME),
      },
    });

    // 5. Success!
    console.log("\n✅✅ SUCCESS! Upload accepted by YouTube.");
    console.log("--------------------------------------------");
    console.log(`Video ID: https://youtu.be/${res.data.id}`);
    console.log(`Status:   ${res.status}`);
    console.log("--------------------------------------------");
    console.log("You can now click the link above to verify the video plays correctly.");

  } catch (error) {
    console.error("\n❌❌ UPLOAD FAILED");
    console.error("Error Message:", error.message);
    if (error.response) {
      console.error("API Response:", JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUpload();