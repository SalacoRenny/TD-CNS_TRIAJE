import express from "express";
import { loginUser, registerUser, syncUserData } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser); // 🆕 NUEVA RUTA DE REGISTRO
router.get("/sync-user/:userId", syncUserData);

export default router;