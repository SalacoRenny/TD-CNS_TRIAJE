import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  // ✅ CAMPOS ORIGINALES (mantener intactos para compatibilidad)
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  ci: { type: String, required: true },
  role: { type: String, enum: ["asegurado", "personal_medico"], required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  // 🆕 CAMPOS ADICIONALES PARA GESTIÓN DE PACIENTES (todos opcionales)
  dateOfBirth: { type: Date }, // Para calcular edad automáticamente
  gender: { type: String, enum: ["masculino", "femenino"] },
  phone: { type: String },
  
  // Estados del Sistema
  status: { 
    type: String, 
    enum: ["registrado", "con_historial"], 
    default: "registrado" 
  },
  lastTriageDate: { type: Date }, // Última vez que usó RegisterSymptoms
  
  // Metadatos
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true } // Para soft delete
});

// 🔐 Cifrar contraseña antes de guardar (mantener lógica original)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 📅 Actualizar updatedAt antes de guardar
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// 🧮 Método virtual para calcular edad
userSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// 🏥 Método para clasificación simple de pacientes
userSchema.methods.getPatientStatus = function() {
  if (this.status === "con_historial") {
    return {
      level: "con_historial",
      color: "#10B981",
      label: "Con Historial",
      bgColor: "#ECFDF5"
    };
  } else {
    return {
      level: "registrado",
      color: "#6B7280",
      label: "Registrado",
      bgColor: "#F9FAFB"
    };
  }
};

// 📊 Método para obtener resumen del paciente
userSchema.methods.getPatientSummary = function() {
  return {
    _id: this._id,
    userId: this.userId,
    name: this.name,
    email: this.email,
    ci: this.ci,
    age: this.age,
    gender: this.gender,
    phone: this.phone,
    status: this.status,
    classification: this.getPatientStatus(),
    lastTriageDate: this.lastTriageDate,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Asegurar que los campos virtuales se incluyan en JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);
export default User;