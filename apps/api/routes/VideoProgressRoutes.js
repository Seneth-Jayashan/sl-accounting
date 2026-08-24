import express from "express";
import { upsertProgress, getMyProgress } from "../controllers/VideoProgressController.js";
import { protect } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.use(protect); // All progress routes require authentication

router.post("/", upsertProgress);
router.get("/", getMyProgress);

export default router;
