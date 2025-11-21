import express from "express";
import { register, login, me, refresh,logout } from "../controllers/AuthController.js";
import { validate, registerSchema, loginSchema } from "../validators/AuthValidator.js";
import {protect} from "../middlewares/AuthMiddleware.js";
import createUploader from "../middlewares/UploadMiddleware.js";
const profileUploadMiddleware = createUploader('images/profile', 'profileImage');

const router = express.Router();


router.post("/register", profileUploadMiddleware, validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

router.post("/refresh", refresh);

router.get("/me", protect, me);

router.post("/logout", protect, logout);


export default router;