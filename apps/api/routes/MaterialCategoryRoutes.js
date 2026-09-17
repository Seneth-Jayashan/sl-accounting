import express from "express";
import MaterialCategoryController from "../controllers/MaterialCategoryController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.post("/", protect, restrictTo("admin"), MaterialCategoryController.createCategory);
router.get("/", protect, MaterialCategoryController.getAllCategories);
router.delete("/:id", protect, restrictTo("admin"), MaterialCategoryController.deleteCategory);

export default router;
