import express from "express";
import contactUScontroll from "../controllers/SupportController.js";
import { protect, restrictTo } from "../middlewares/AuthMiddleware.js";

const router = express.Router();

router.get("/", protect, restrictTo("admin", "customer_supporter"), contactUScontroll.getAllMs);
router.post("/", contactUScontroll.addMs);
router.get("/:id", protect, restrictTo("admin", "customer_supporter"), contactUScontroll.getByID);
router.put("/:id", protect, restrictTo("admin", "customer_supporter"), contactUScontroll.replyUser);
router.delete("/:id", protect, restrictTo("admin", "customer_supporter"), contactUScontroll.deletecontactM);

export default router;
