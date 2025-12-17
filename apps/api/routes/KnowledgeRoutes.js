import express from "express";
import {
  createKnowledge,
  getAllKnowledge,
  getKnowledgeById,
  updateKnowledge,
  deleteKnowledge,
  downloadKnowledge,
} from "../controllers/KnowledgeBaseController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";
import { createDocumentUploader } from "../middlewares/UploadMiddleware.js";

const router = express.Router();

router.post(
  "/",
  protect,
  restrictTo("admin"),
  createDocumentUploader("docs", "file"),
  createKnowledge
);
router.put(
  "/:id",
  protect,
  restrictTo("admin"),
  createDocumentUploader("docs", "file"),
  updateKnowledge
);
router.delete("/:id", protect, restrictTo("admin"), deleteKnowledge);

router.get("/", protect, getAllKnowledge);
router.get("/:id", protect, getKnowledgeById);
router.get("/:id/download", protect, downloadKnowledge);

export default router;
