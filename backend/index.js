//index.js:
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

// Modelos
import SymptomRecord from "./src/models/SymptomRecord.js";
import User from "./src/models/User.js";

// Rutas
import authRoutes from "./src/routes/authRoutes.js";
import symptomRoutes from "./src/routes/symptomRoutes.js";
import medicalRoutes from "./src/routes/medicalRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// Ruta para registrar síntomas
app.post("/api/symptoms", async (req, res) => {
  try {
    const newRecord = new SymptomRecord(req.body);
    const saved = await newRecord.save();
    res.status(201).json({ message: "Síntomas registrados", data: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta para registrar usuarios
app.post("/api/users", async (req, res) => {
  try {
    const newUser = new User(req.body);
    const saved = await newUser.save();
    res.status(201).json({ message: "Usuario registrado", data: saved });
  } catch (err) {
    console.error("❌ Error en registro:", err);
    res.status(500).json({ error: err.message });
  }
});

// Ruta de login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Contraseña incorrecta" });

    console.log("🟢 Usuario encontrado y autenticado:", user);

    res.status(200).json({
      id: user.userId,
      fullName: user.name,
      email: user.email,
      ci: user.ci,
      role: user.role
    });
  } catch (err) {
    console.error("❌ Error en login:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
});

// Cargar rutas del sistema
console.log("🟡 Cargando rutas de autenticación...");
app.use("/api/auth", authRoutes);

console.log("🟡 Cargando rutas de síntomas...");
app.use("/api/symptom-records", symptomRoutes);

console.log("🟡 Cargando rutas médicas...");
app.use("/api/medical", medicalRoutes);

// Ruta de salud del sistema
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Sistema de Triaje CNS funcionando correctamente",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    endpoints: {
      symptoms: "/api/symptoms",
      users: "/api/users", 
      auth: "/api/auth",
      records: "/api/symptom-records",
      medical: "/api/medical"
    }
  });
});

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Endpoint no encontrado",
    availableEndpoints: [
      "POST /api/symptoms",
      "POST /api/users",
      "POST /api/auth/login",
      "GET /api/symptom-records/history/:userId",
      "GET /api/medical/dashboard-stats",
      "GET /api/medical/records",
      "GET /api/medical/urgency-analysis",
      "GET /api/health"
    ]
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🎉 ====================================`);
  console.log(`🌐 Servidor CNS Triaje Inteligente`);
  console.log(`🌐 Corriendo en: http://localhost:${PORT}`);
  console.log(`🎉 ====================================`);
  console.log(`\n📊 Dashboard Médico:`);
  console.log(`   📈 Estadísticas: http://localhost:${PORT}/api/medical/dashboard-stats`);
  console.log(`   📋 Registros: http://localhost:${PORT}/api/medical/records`);
  console.log(`   🚨 Análisis: http://localhost:${PORT}/api/medical/urgency-analysis`);
  console.log(`\n❤️  Estado del sistema: http://localhost:${PORT}/api/health`);
  console.log(`\n✅ Sistema listo para recibir peticiones!\n`);
});