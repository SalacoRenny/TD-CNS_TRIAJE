import express from "express";
import { createSymptomRecord, getSymptomHistoryByUser } from "../controllers/symptomController.js";

const router = express.Router();

router.post("/", createSymptomRecord);
router.get("/history/:userId", getSymptomHistoryByUser);

export default router;
