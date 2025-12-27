import { sendSMS } from 'textlk-node';

const SmsSender = {
  /**
   * Send a single SMS using the configured driver (Text.lk)
   * @param {string} phoneNumber - The recipient's phone number (e.g., '9471XXXXXXX')
   * @param {string} message - The message content
   * @returns {Promise<object>} - The API response result
   */
  send: async (phoneNumber, message) => {
    // Check if the SMS driver is enabled
    if (process.env.SMS_DRIVER !== 'textlk') {
      console.warn(`SMS_DRIVER is set to ${process.env.SMS_DRIVER}. Skipping Text.lk send.`);
      return { success: false, message: 'SMS Driver not configured for Text.lk' };
    }

    try {
      // The textlk-node library automatically looks for TEXTLK_API_TOKEN
      // Since your .env uses TEXTLK_API_KEY, we map it explicitly here.
      const result = await sendSMS({
        phoneNumber,
        message,
        apiToken: process.env.TEXTLK_API_KEY, // Mapping your .env variable
        senderId: process.env.TEXTLK_SENDER_ID // Mapping your .env variable
      });

      console.log(`[SmsSender] SMS sent to ${phoneNumber}:`, result);
      return { success: true, data: result };
    } catch (error) {
      console.error(`[SmsSender] Failed to send SMS to ${phoneNumber}:`, error.message);
      // Return a safe error object so the calling function doesn't crash
      return { success: false, error: error.message };
    }
  }
};

export default SmsSender;