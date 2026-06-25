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
            const studentId = req.user._id;

            const enrolledClasses = await Class.find({ students: studentId }).select('_id');

            if (!enrolledClasses || enrolledClasses.length === 0) {
                return res.status(200).json({ success: true, count: 0, data: [] });
            }

            const classIds = enrolledClasses.map(c => c._id);

            const materials = await Material.find({
                class: { $in: classIds },
                isPublished: true
            })
                .populate('class', 'name level type')
                .sort("-createdAt");

            res.status(200).json({ success: true, count: materials.length, data: materials });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }                                                                                                                                                                                                    // Admin: Update Material
    async updateMaterial(req, res) {
        try {
            const { title, description, classId } = req.body;

            let updateData = {
                title,
                description,
                class: classId
            };

            if (req.file) {
                updateData.fileUrl = `/uploads/materials/${req.file.filename}`;
                updateData.fileSize = (req.file.size / (1024 * 1024)).toFixed(2) + " MB";

                const ext = path.extname(req.file.originalname).toLowerCase();
                let fileType = "other";
                if (ext === ".pdf") fileType = "pdf";
                else if (ext === ".pptx" || ext === ".ppt") fileType = "pptx";
                else if (ext === ".docx" || ext === ".doc") fileType = "docx";
                else if ([".png", ".jpg", ".jpeg"].includes(ext)) fileType = "image";

                updateData.fileType = fileType;
            }

            const material = await Material.findByIdAndUpdate(req.params.id, updateData, { new: true });

            if (!material) {
                return res.status(404).json({ message: "Material not found" });
            }

            res.status(200).json({ success: true, data: material });
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    // Admin: Delete Material
    async deleteMaterial(req, res) {
        try {
            const material = await Material.findById(req.params.id);
            if (!material) return res.status(404).json({ message: "Material not found" });

            try {
                const filePath = path.join(process.cwd(), material.fileUrl);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileErr) {
                console.warn("Could not delete physical file, continuing with DB deletion:", fileErr.message);
            }

            await material.deleteOne();
            res.status(200).json({ success: true, message: "Material and file deleted" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // Student/Admin: Download Material
    async downloadMaterial(req, res) {
        try {
            const material = await Material.findById(req.params.id);
            if (!material) return res.status(404).json({ message: "Material not found" });

            if (!material.fileUrl) return res.status(404).json({ message: 'File not available' });

            const fileAbsolute = path.isAbsolute(material.fileUrl) ? material.fileUrl : path.join(process.cwd(), material.fileUrl);
            if (!fs.existsSync(fileAbsolute)) return res.status(404).json({ message: 'File not found on server' });

            // Extract original filename or default to a generic name based on title and extension
            let fileName = material.title.replace(/\s+/g, '-').toLowerCase();
            const ext = path.extname(material.fileUrl);
            if (!fileName.endsWith(ext)) fileName += ext;
            
            return res.download(fileAbsolute, fileName);
        } catch (error) {
            console.error('Download Material Error:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
    }
}

export default new MaterialController();