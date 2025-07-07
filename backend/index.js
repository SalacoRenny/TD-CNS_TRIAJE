import dotenv from "dotenv";

// 🔧 CARGAR .env ANTES QUE TODO
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";

// Modelos
import SymptomRecord from "./src/models/SymptomRecord.js";
import User from "./src/models/User.js";

// Rutas existentes
import authRoutes from "./src/routes/authRoutes.js";
import symptomRoutes from "./src/routes/symptomRoutes.js";
import medicalRoutes from "./src/routes/medicalRoutes.js";
import patientRoutes from "./src/routes/patientRoutes.js";
import chatTriageRoutes from "./src/routes/chatTriageRoutes.js"; // 🆕 NUEVA RUTA

// 🚫 NO importar Watson aquí todavía

const app = express();

app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// ===============================================
// 🤖 CARGA DINÁMICA DE WATSON (DESPUÉS DE DOTENV)
// ===============================================

let watsonRoutes = null;
let createSymptomRecord = null;

async function loadWatsonServices() {
  try {
    console.log('🔍 Variables Watson disponibles:');
    console.log('API_KEY:', process.env.IBM_WATSON_API_KEY ? '✅' : '❌');
    console.log('DEPLOYMENT_ID:', process.env.IBM_WATSON_DEPLOYMENT_ID ? '✅' : '❌');
    console.log('PROJECT_ID:', process.env.IBM_WATSON_PROJECT_ID ? '✅' : '❌');

    if (!process.env.IBM_WATSON_API_KEY || !process.env.IBM_WATSON_DEPLOYMENT_ID || !process.env.IBM_WATSON_PROJECT_ID) {
      console.log('⚠️ Watson no configurado - usando modo básico');
      return false;
    }

    console.log('🤖 Cargando servicios Watson...');
    
    // Importación dinámica DESPUÉS de verificar variables
    const watsonRoutesModule = await import("./src/routes/watsonRoutes.js");
    const symptomControllerModule = await import("./src/controllers/symptomController.js");
    
    watsonRoutes = watsonRoutesModule.default;
    createSymptomRecord = symptomControllerModule.createSymptomRecord;
    
    console.log('✅ Watson cargado exitosamente');
    return true;
    
  } catch (error) {
    console.error('❌ Error cargando Watson:', error.message);
    return false;
  }
}

// Cargar Watson después de configurar dotenv
const watsonLoaded = await loadWatsonServices();

// ===============================================
// 🤖 RUTA PRINCIPAL DE SÍNTOMAS
// ===============================================

if (watsonLoaded && createSymptomRecord) {
  // Usar versión Watson
  app.post("/api/symptoms", createSymptomRecord);
  console.log('🤖 Endpoint /api/symptoms configurado con Watson IA');
} else {
  // Usar versión básica
  app.post("/api/symptoms", async (req, res) => {
    try {
      const newRecord = new SymptomRecord(req.body);
      const saved = await newRecord.save();
      
      // Actualizar estado del usuario
      try {
        await User.findOneAndUpdate(
          { userId: req.body.userId },
          { 
            status: "con_historial",
            lastTriageDate: new Date(),
            updatedAt: new Date()
          }
        );
      } catch (userUpdateError) {
        console.log("⚠️ No se pudo actualizar estado del usuario:", userUpdateError.message);
      }
      
      res.status(201).json({ 
        message: "Síntomas registrados (modo básico)", 
        data: saved,
        mode: "basic"
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  console.log('⚠️ Endpoint /api/symptoms en modo básico (sin Watson)');
}

// ===============================================
// ✅ RUTAS ORIGINALES
// ===============================================

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

// ===============================================
// 📚 CARGAR RUTAS
// ===============================================

console.log("🟡 Cargando rutas de autenticación...");
app.use("/api/auth", authRoutes);

console.log("🟡 Cargando rutas de síntomas...");
app.use("/api/symptom-records", symptomRoutes);

console.log("🟡 Cargando rutas médicas...");
app.use("/api/medical", medicalRoutes);

console.log("🆕 Cargando rutas de pacientes...");
app.use("/api/patients", patientRoutes);

// 🗣️ NUEVAS RUTAS DE CHAT TRIAJE
console.log("💬 Cargando rutas de Chat Triaje Watson IA...");
app.use("/api/chat-triage", chatTriageRoutes);

// Watson routes (si se cargaron)
if (watsonRoutes) {
  app.use("/api/watson", watsonRoutes);
  console.log("🤖 Rutas Watson activadas");
} else {
  app.get("/api/watson/status", (req, res) => {
    res.status(503).json({
      status: "NO_CONFIGURADO",
      message: "Watson no está configurado",
      variables_needed: [
        "IBM_WATSON_API_KEY",
        "IBM_WATSON_DEPLOYMENT_ID",
        "IBM_WATSON_PROJECT_ID"
      ]
    });
  });
  console.log("⚠️ Rutas Watson no disponibles");
}

// ===============================================
// 🏥 RUTA DE SALUD
// ===============================================

app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "Conectado" : "Desconectado";
    const totalRecords = await SymptomRecord.countDocuments();
    const totalUsers = await User.countDocuments();

    // 🆕 Verificar estado del chat triaje
    let chatTriageStatus = "No disponible";
    try {
      const Conversation = (await import("./src/models/Conversation.js")).default;
      const totalConversations = await Conversation.countDocuments();
      const activeConversations = await Conversation.countDocuments({ status: 'active' });
      chatTriageStatus = `Activo (${totalConversations} total, ${activeConversations} activas)`;
    } catch (chatError) {
      chatTriageStatus = "Error al verificar";
    }

    res.json({ 
      status: "OK", 
      message: `Sistema CNS ${watsonLoaded ? 'con Watson IA' : 'modo básico'}`,
      timestamp: new Date().toISOString(),
      version: watsonLoaded ? "2.0.0 - Watson IA + Chat" : "1.0.0 - Básico + Chat",
      database: {
        status: dbStatus,
        totalRecords,
        totalUsers
      },
      watson_status: {
        loaded: watsonLoaded,
        configured: !!process.env.IBM_WATSON_API_KEY
      },
      chat_triage_status: chatTriageStatus, // 🆕 Estado del chat
      features: {
        form_triage: "✅ Disponible",
        chat_triage: "✅ Disponible", // 🆕 Feature chat
        watson_ai: watsonLoaded ? "✅ Disponible" : "❌ No configurado",
        fallback_system: "✅ Disponible"
      }
    });

  } catch (error) {
    console.error("❌ Error en health check:", error);
    res.status(500).json({
      status: "ERROR",
      error: error.message
    });
  }
});

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Endpoint no encontrado",
    system_version: watsonLoaded ? "2.0.0 - Watson IA + Chat" : "1.0.0 - Básico + Chat",
    available_endpoints: {
      form_triage: "/api/symptoms",
      chat_triage: "/api/chat-triage/*", // 🆕 Endpoint del chat
      watson: "/api/watson/*",
      medical: "/api/medical/*",
      health: "/api/health"
    }
  });
});

// ===============================================
// 🚀 INICIAR SERVIDOR
// ===============================================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🎉 ====================================`);
  console.log(`🌐 Servidor CNS Triaje ${watsonLoaded ? 'con Watson IA' : 'Básico'}`);
  console.log(`🌐 Corriendo en: http://localhost:${PORT}`);
  console.log(`🎉 ====================================`);
  
  if (watsonLoaded) {
    console.log(`\n🤖 Watson IA: ✅ ACTIVO`);
    console.log(`   🧪 Test: http://localhost:${PORT}/api/watson/test-connection`);
  } else {
    console.log(`\n⚠️ Watson IA: ❌ NO CONFIGURADO`);
    console.log(`   📋 Status: http://localhost:${PORT}/api/watson/status`);
  }
  
  // 🆕 Información del Chat Triaje
  console.log(`\n💬 Chat Triaje: ✅ DISPONIBLE`);
  console.log(`   🚀 Iniciar: http://localhost:${PORT}/api/chat-triage/start`);
  console.log(`   📝 Docs: http://localhost:${PORT}/api/chat-triage/docs`);
  console.log(`   🏥 Estado: http://localhost:${PORT}/api/chat-triage/health`);
  
  console.log(`\n❤️  Estado General: http://localhost:${PORT}/api/health`);
  console.log(`\n✅ Sistema CNS listo con Chat Watson IA!\n`);
});