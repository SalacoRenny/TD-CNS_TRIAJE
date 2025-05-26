import mongoose from "mongoose";

const SymptomRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  symptoms: { type: [String], required: true },
  baseConditions: { type: [String], default: [] },
  notes: { type: String },
  temperature: { type: String, default: "" }, // nuevo campo
  timestamp: { type: String, required: true }, // capturado desde el frontend (fecha/hora en texto)
  createdAt: { type: Date, default: Date.now }, // fecha del servidor
});

const SymptomRecord = mongoose.model("SymptomRecord", SymptomRecordSchema);
export default SymptomRecord;
