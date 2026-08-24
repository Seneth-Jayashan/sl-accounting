import News from "../models/News.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAllNews = async (req, res) => {
    try {
        // If query has published=true, or if user is not admin
        // We'll let routes handle public vs admin. Admin can fetch all.
        // For public route, we will pass a filter in the route or handle it here based on a query param.
        const { isPublished } = req.query;
        let filter = {};
        if (isPublished === 'true') {
            filter.isPublished = true;
        } else if (isPublished === 'false') {
            filter.isPublished = false;
        }

        const newsList = await News.find(filter).sort({ createdAt: -1 });
        res.status(200).json(newsList);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ message: "Failed to fetch news", error: error.message });
    }
};

export const getNewsById = async (req, res) => {
    try {
        const newsItem = await News.findById(req.params.id);
        if (!newsItem) return res.status(404).json({ message: "News item not found" });
        res.status(200).json(newsItem);
    } catch (error) {
        console.error("Error fetching news:", error);
        res.status(500).json({ message: "Failed to fetch news", error: error.message });
    }
};

export const createNews = async (req, res) => {
    try {
        const { title, content, category, isPublished } = req.body;
        
        let coverImage = "";
        if (req.file) {
            coverImage = `/uploads/images/news/${req.file.filename}`;
        }

        const newNews = new News({
            title,
            content,
            category,
            coverImage,
            isPublished: isPublished === 'true' || isPublished === true,
        });

        await newNews.save();
        res.status(201).json({ message: "News created successfully", news: newNews });
    } catch (error) {
        console.error("Error creating news:", error);
        res.status(500).json({ message: "Failed to create news", error: error.message });
    }
};

export const updateNews = async (req, res) => {
    try {
        const { title, content, category, isPublished } = req.body;
        
        const newsItem = await News.findById(req.params.id);
        if (!newsItem) return res.status(404).json({ message: "News item not found" });

        let coverImage = newsItem.coverImage;
        if (req.file) {
            // New image uploaded, delete old one if exists
            if (coverImage) {
                const oldImagePath = path.join(__dirname, "..", "..", coverImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            coverImage = `/uploads/images/news/${req.file.filename}`;
        }

        newsItem.title = title || newsItem.title;
        newsItem.content = content || newsItem.content;
        newsItem.category = category || newsItem.category;
        newsItem.coverImage = coverImage;
        if (isPublished !== undefined) {
            newsItem.isPublished = isPublished === 'true' || isPublished === true;
        }

        await newsItem.save();
        res.status(200).json({ message: "News updated successfully", news: newsItem });
    } catch (error) {
        console.error("Error updating news:", error);
        res.status(500).json({ message: "Failed to update news", error: error.message });
    }
};

export const deleteNews = async (req, res) => {
    try {
        const newsItem = await News.findById(req.params.id);
        if (!newsItem) return res.status(404).json({ message: "News item not found" });

        if (newsItem.coverImage) {
            const imagePath = path.join(__dirname, "..", "..", newsItem.coverImage);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await newsItem.deleteOne();
        res.status(200).json({ message: "News deleted successfully" });
    } catch (error) {
        console.error("Error deleting news:", error);
        res.status(500).json({ message: "Failed to delete news", error: error.message });
    }
};
