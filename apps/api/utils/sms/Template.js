import SmsSender from "../../services/SmsSender.js";

// --- Configuration ---
const BRAND_NAME = "SL Accounting";

/* ---------- Helpers ---------- */

/**
 * Format phone numbers to the international standard required by Text.lk (e.g., 9477xxxxxxx).
 * Removes spaces, dashes, and ensures '94' prefix.
 */
const sanitizePhone = (phone) => {
  if (!phone) return "";
  
  // Remove all non-numeric characters
  let cleanNumber = phone.replace(/\D/g, "");

  // If number starts with '0' (e.g., 077...), remove the leading zero
  if (cleanNumber.startsWith("0")) {
    cleanNumber = cleanNumber.substring(1);
  }

  // If number doesn't start with '94', add it
  if (!cleanNumber.startsWith("94")) {
    cleanNumber = "94" + cleanNumber;
  }

  return cleanNumber;
};

/**
 * Shorten URLs if necessary (Optional placeholder).
 * In production, you might want to use a URL shortener service to save SMS characters.
 */
const shortUrl = (url) => url; 

/* ---------- Templates ---------- */

/**
 * Send OTP Verification Code
 * Message Length: ~60 chars
 */
export const sendVerificationSms = async (phone, otpCode) => {
  const message = `${BRAND_NAME}: Your verification code is ${otpCode}. Do not share this code.`;
  
  return SmsSender.send(sanitizePhone(phone), message);
};

/**
 * Send Welcome Message
 * Message Length: ~80 chars
 */
export const sendWelcomeSms = async (phone, name) => {
  const message = `Welcome to ${BRAND_NAME}, ${name}! Your account is active. Log in to view your classes.`;
  
  return SmsSender.send(sanitizePhone(phone), message);
};

/**
 * Send Payment Receipt
 * Message Length: ~100 chars
 */
export const sendPaymentReceiptSms = async (phone, amount, className, refId) => {
  // Truncate class name to ensure message fits
  const safeClassName = className.length > 20 ? className.substring(0, 18) + ".." : className;
  
  const message = `${BRAND_NAME}: Payment received LKR ${amount} through Online Payment Gateway for ${safeClassName}. Ref: ${refId}. Thank you!`;
  
  return SmsSender.send(sanitizePhone(phone), message);
};

/**
 * Send Class Reminder
 * Message Length: ~120 chars
 */
export const sendClassReminderSms = async (phone, className, time, link) => {
  const safeClassName = className.length > 20 ? className.substring(0, 18) + ".." : className;
  
  // Note: Ensure the 'link' is short, otherwise this might split into 2 SMS segments
  const message = `Reminder: ${safeClassName} starts at ${time}. Join here: ${shortUrl(link)}`;
  
  return SmsSender.send(sanitizePhone(phone), message);
};

/**
 * Send Generic Notification
 * Message Length: Variable (Watch for 160 char limit)
 */
export const sendNotificationSms = async (phone, text) => {
  const message = `${BRAND_NAME}: ${text}`;
  
  return SmsSender.send(sanitizePhone(phone), message);
};

/**
 * Send Cancellation Alert
 * Message Length: ~100 chars
 */
export const sendCancellationSms = async (phone, className, reason) => {
  const message = `${BRAND_NAME}: Session for ${className} has been cancelled. Reason: ${reason}. Check portal for details.`;
  
  return SmsSender.send(sanitizePhone(phone), message);
};

export const sendAdminPaymentNotificationSms = async (adminPhone, userName, amount, className, refId) => {
  const message = `Admin Alert: ${userName} made a payment of LKR ${amount} for ${className}. Ref: ${refId}.Please Review.`;
  return SmsSender.send(sanitizePhone(adminPhone), message);
};

export const sendPaymentVerifiedSms = async (phone, amount, className) => {
  const message = `${BRAND_NAME}: Your payment of LKR ${amount} for ${className} has been verified. Thank you!`;
  return SmsSender.send(sanitizePhone(phone), message);
};

export const sendClassRescheduleSms = async (phone, className, newTime) => {
  const message = `${BRAND_NAME}: The session for ${className} has been rescheduled to ${newTime}. Please check your schedule.`;
  return SmsSender.send(sanitizePhone(phone), message);
};

export const sendEnrollmentConfirmationSms = async (phone, className) => {
  const message = `${BRAND_NAME}: You have been successfully enrolled in ${className}. Welcome aboard!`;
  return SmsSender.send(sanitizePhone(phone), message);
};



// Export as a bundle for easier imports if needed
export default {
  sendVerificationSms,
  sendWelcomeSms,
  sendPaymentReceiptSms,
  sendClassReminderSms,
  sendNotificationSms,
  sendCancellationSms,
  sendAdminPaymentNotificationSms,
  sendPaymentVerifiedSms,
  sendClassRescheduleSms,
  sendEnrollmentConfirmationSms,
};