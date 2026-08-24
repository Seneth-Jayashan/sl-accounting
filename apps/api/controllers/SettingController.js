import Setting from '../models/Setting.js';
import fs from 'fs';
import path from 'path';

/**
 * Get current system settings
 * If no settings document exists, create one with defaults.
 */
export const getSettings = async (req, res) => {
    try {
        let setting = await Setting.findOne();
        
        if (!setting) {
            setting = await Setting.create({});
        }
        
        return res.status(200).json({ success: true, data: setting });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

/**
 * Update system settings (Admin only)
 * Supports updating examDate, newsTitle, newsLink, and handles heroImage upload.
 */
export const updateSettings = async (req, res) => {
    try {
        const { examDate, newsTitle, newsLink } = req.body;
        
        let setting = await Setting.findOne();
        if (!setting) {
            setting = new Setting();
        }

        if (examDate !== undefined) {
            setting.examDate = examDate ? new Date(examDate) : null;
        }
        
        if (newsTitle !== undefined) {
            setting.newsTitle = newsTitle;
        }

        if (newsLink !== undefined) {
            setting.newsLink = newsLink;
        }

        // Handle uploaded hero image
        if (req.file) {
            // Optional: delete old image if it exists to save space
            if (setting.heroImageUrl) {
                const oldImagePath = path.join(process.cwd(), setting.heroImageUrl);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            // Create accessible URL path from the uploaded file
            // Assuming req.file.path looks like 'uploads/images/settings/file.jpg'
            // We store it with a leading slash so it can be served statically
            setting.heroImageUrl = '/' + req.file.path.replace(/\\/g, '/');
        }

        await setting.save();

        return res.status(200).json({ success: true, message: 'Settings updated successfully', data: setting });
    } catch (error) {
        console.error("Error updating settings:", error);
        return res.status(500).json({ success: false, message: 'Server error while updating settings' });
    }
};

import axios from 'axios';

/**
 * Get SMS Balance from text.lk
 */
export const getSmsBalance = async (req, res) => {
    try {
        const response = await axios.get(
            `https://app.text.lk/api/http/balance?api_token=${process.env.TEXTLK_API_KEY}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        console.error("Error fetching SMS balance:", error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
