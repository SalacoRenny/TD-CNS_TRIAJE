import SymptomRecord from "../models/SymptomRecord.js";

// Crear nuevo registro de síntomas
export const createSymptomRecord = async (req, res) => {
  try {
    const newRecord = new SymptomRecord(req.body);
    await newRecord.save();
    res.status(201).json({ message: "Registro guardado exitosamente", data: newRecord });
  } catch (error) {
    console.error("Error al guardar los síntomas:", error);
    res.status(500).json({ error: "Error al guardar los síntomas" });
  }
};

// Obtener historial de un usuario específico
export const getSymptomHistoryByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await SymptomRecord.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
