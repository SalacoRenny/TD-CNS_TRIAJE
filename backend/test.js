// test.js - Script de diagnóstico mínimo
import express from "express";

console.log("🔍 Iniciando diagnóstico...");

const app = express();

console.log("✅ Express importado correctamente");

// Probar middleware básico
app.use(express.json());
console.log("✅ Middleware JSON configurado");

// Probar ruta simple
app.get("/test", (req, res) => {
  res.json({ message: "Test OK" });
});
console.log("✅ Ruta de prueba creada");

// Intentar iniciar servidor
const PORT = 5001;
try {
  app.listen(PORT, () => {
    console.log(`✅ Servidor de prueba funcionando en puerto ${PORT}`);
    console.log(`🧪 Prueba: http://localhost:${PORT}/test`);
  });
} catch (error) {
  console.error("❌ Error al iniciar servidor:", error);
}