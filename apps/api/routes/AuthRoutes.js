import express from "express";
import { register, login, me, refresh } from "../controllers/AuthController.js";
import { validate, registerSchema, loginSchema } from "../validators/AuthValidator.js";
import {protect} from "../middlewares/AuthMiddleware.js";
import createUploader from "../middlewares/UploadMiddleware.js";
const profileUploadMiddleware = createUploader('images/profile', 'profileImage');

const router = express.Router();

// CRITICAL FIX: Multer (profileUploadMiddleware) MUST run before Zod validation 
// (validate(registerSchema)) to populate req.body from form-data.
router.post("/register", profileUploadMiddleware, validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

// New endpoint for token rotation
router.post("/refresh", refresh);

router.get("/me", protect, me);


export default router;