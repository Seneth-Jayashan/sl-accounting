import Material from "../models/Material.js";
import fs from "fs";
import path from "path";

class MaterialController {
    async createMaterial(req, res) {
        try {
            // If no file was uploaded by middleware
            if (!req.file) {
                return res.status(400).json({ success: false, message: "Please upload a file" });
            }

            const { title, description, classId } = req.body;

            // req.file contains: path, mimetype, size
            const fileUrl = `/uploads/materials/${req.file.filename}`;
            const fileSize = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";
            
            // Determine file type category based on extension
            const ext = path.extname(req.file.originalname).toLowerCase();
            let fileType = "other";
            if (ext === ".pdf") fileType = "pdf";
            else if (ext === ".pptx" || ext === ".ppt") fileType = "pptx";
            else if (ext === ".docx" || ext === ".doc") fileType = "docx";
            else if ([".png", ".jpg", ".jpeg"].includes(ext)) fileType = "image";

            const material = await Material.create({
                title,
                description,
                fileUrl,
                fileType,
                fileSize,
                class: classId
            });

            res.status(201).json({ success: true, data: material });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Admin: Get all materials (optional filter by class)
    async getAllMaterials(req, res) {
        try {
            const { classId } = req.query;
            const filter = classId ? { class: classId } : {};
            
            const materials = await Material.find(filter)
                .populate("classDetails", "name")
                .sort("-createdAt");

            res.status(200).json({ success: true, count: materials.length, data: materials });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Student: Get materials for their class
    async getStudentMaterials(req, res) {
        try {
            const { classId } = req.body; // Sent from frontend student view

            const materials = await Material.find({ 
                class: classId, 
                isPublished: true 
            }).sort("-createdAt");

            res.status(200).json({ success: true, data: materials });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    // Admin: Delete Material
    async deleteMaterial(req, res) {
        try {
            const material = await Material.findById(req.params.id);
            if (!material) return res.status(404).json({ message: "Material not found" });

            // OPTIONAL: Delete the physical file from the server
            const filePath = path.join(process.cwd(), material.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }

            await material.deleteOne();
            res.status(200).json({ success: true, message: "Material and file deleted" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new MaterialController();