import MaterialCategory from "../models/MaterialCategory.js";

class MaterialCategoryController {
    async createCategory(req, res) {
        try {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ success: false, message: "Category name is required" });
            }

            const category = await MaterialCategory.create({ name });
            res.status(201).json({ success: true, data: category });
        } catch (error) {
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({ success: false, message: "Category already exists" });
            }
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async getAllCategories(req, res) {
        try {
            const categories = await MaterialCategory.find().sort({ createdAt: -1 });
            res.status(200).json({ success: true, count: categories.length, data: categories });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    async deleteCategory(req, res) {
        try {
            const category = await MaterialCategory.findByIdAndDelete(req.params.id);
            if (!category) {
                return res.status(404).json({ success: false, message: "Category not found" });
            }
            res.status(200).json({ success: true, message: "Category deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

export default new MaterialCategoryController();
