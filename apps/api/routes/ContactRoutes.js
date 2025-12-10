import express from "express";
import contactUScontroll from "../controllers/SupportController.js";

const router = express.Router();

router.get("/", contactUScontroll.getAllMs);
router.post("/", contactUScontroll.addMs);
router.get("/:id", contactUScontroll.getByID);
router.put("/:id", contactUScontroll.replyUser);
router.delete("/:id", contactUScontroll.deletecontactM);

export default router;
