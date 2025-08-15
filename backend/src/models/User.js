import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  
  // 🆕 NUEVOS CAMPOS PRINCIPALES
  firstName: { type: String },      // No required para compatibilidad
  lastName: { type: String },       // No required para compatibilidad  
  motherLastName: { type: String }, 
  
  // 🔄 CAMPO LEGACY (mantener para compatibilidad hacia atrás)
  name: { type: String },
  
  email: { type: String, required: true, unique: true },
  ci: { type: String, required: true, unique: true },
  role: { type: String, enum: ["asegurado", "personal_medico", "asistente"], required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  
  dateOfBirth: { type: Date },
  gender: { 
    type: String, 
    enum: ["masculino", "femenino", ""], 
    default: "" 
  },
  phone: { type: String },
  
  status: { 
    type: String, 
    enum: ["registrado", "con_historial"], 
    default: "registrado" 
  },
  lastTriageDate: { type: Date },
  
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// 🔗 MÉTODO VIRTUAL MEJORADO - Compatibilidad total
userSchema.virtual("fullName").get(function () {
  // Si tenemos los nuevos campos, usarlos
  if (this.firstName && this.lastName) {
    return [this.firstName, this.lastName, this.motherLastName]
      .filter(Boolean)
      .join(' ');
  }
  // Si solo tenemos el campo legacy 'name', usarlo
  else if (this.name) {
    return this.name;
  }
  // Fallback
  return 'Sin nombre';
});

// 🔗 MÉTODO VIRTUAL PARA MANTENER COMPATIBILIDAD (getter y setter)
userSchema.virtual("displayName").get(function () {
  return this.fullName;
});

// 🛠️ FUNCIÓN HELPER: Limpiar fecha inválida - ¡NUEVA Y CRÍTICA!
const cleanInvalidDate = (dateValue) => {
  if (!dateValue) return new Date();
  
  // Si ya es una fecha válida, devolverla
  if (dateValue instanceof Date && !isNaN(dateValue)) {
    return dateValue;
  }
  
  // Si es string, intentar limpiarla
  if (typeof dateValue === 'string') {
    // Detectar formatos inválidos como "2025-05-21TXX:XX:XXZ"
    if (dateValue.includes('XX') || dateValue.includes('undefined')) {
      console.log(`🔧 Limpiando fecha inválida: "${dateValue}" → usando fecha actual`);
      return new Date();
    }
    
    // Intentar parsear fecha string
    const parsedDate = new Date(dateValue);
    if (!isNaN(parsedDate)) {
      return parsedDate;
    }
  }
  
  // Fallback: fecha actual
  console.log(`🔧 Fecha inválida detectada: "${dateValue}" → usando fecha actual`);
  return new Date();
};

// 🛠️ MÉTODO PARA AUTO-MIGRAR datos legacy en tiempo real - MEJORADO CON FECHAS
userSchema.methods.migrateNameIfNeeded = function() {
  let needsSave = false;
  
  // 🆕 LIMPIAR FECHAS INVÁLIDAS ANTES DE MIGRAR NOMBRES - ¡ESTO ES LO CRÍTICO!
  if (this.createdAt && (typeof this.createdAt === 'string' || isNaN(new Date(this.createdAt)))) {
    console.log(`🔧 Limpiando createdAt inválido para ${this.userId}: "${this.createdAt}"`);
    this.createdAt = cleanInvalidDate(this.createdAt);
    needsSave = true;
  }
  
  if (this.updatedAt && (typeof this.updatedAt === 'string' || isNaN(new Date(this.updatedAt)))) {
    console.log(`🔧 Limpiando updatedAt inválido para ${this.userId}: "${this.updatedAt}"`);
    this.updatedAt = cleanInvalidDate(this.updatedAt);
    needsSave = true;
  }
  
  if (this.lastTriageDate && (typeof this.lastTriageDate === 'string' || isNaN(new Date(this.lastTriageDate)))) {
    console.log(`🔧 Limpiando lastTriageDate inválido para ${this.userId}: "${this.lastTriageDate}"`);
    this.lastTriageDate = cleanInvalidDate(this.lastTriageDate);
    needsSave = true;
  }
  
  if (this.dateOfBirth && (typeof this.dateOfBirth === 'string' || isNaN(new Date(this.dateOfBirth)))) {
    console.log(`🔧 Limpiando dateOfBirth inválido para ${this.userId}: "${this.dateOfBirth}"`);
    this.dateOfBirth = cleanInvalidDate(this.dateOfBirth);
    needsSave = true;
  }
  
  // Si tenemos 'name' pero no firstName/lastName, migrar automáticamente
  if (this.name && (!this.firstName || !this.lastName)) {
    const nameParts = this.name.trim().split(' ');
    
    if (nameParts.length >= 2) {
      this.firstName = nameParts[0];
      this.lastName = nameParts[1];
      
      // Si hay 3 partes o más, asumir que la última es apellido materno
      if (nameParts.length >= 3) {
        this.motherLastName = nameParts.slice(2).join(' ');
      }
    } else {
      // Solo un nombre, ponerlo como firstName
      this.firstName = this.name;
      this.lastName = "Sin Apellido"; // Placeholder
    }
    
    console.log(`🔄 Auto-migrated user ${this.userId}: "${this.name}" → "${this.firstName} ${this.lastName}"`);
    needsSave = true;
  }
  
  return { needsSave, user: this };
};

// 🔐 Cifrar contraseña antes de guardar
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

// 🔄 AUTO-MIGRACIÓN Y LIMPIEZA antes de guardar - MEJORADO CON FECHAS
userSchema.pre("save", function (next) {
  try {
    // 🆕 LIMPIAR FECHAS ANTES DE GUARDAR - ¡ESTO PREVIENE EL ERROR!
    if (this.createdAt && (typeof this.createdAt === 'string' || isNaN(new Date(this.createdAt)))) {
      this.createdAt = cleanInvalidDate(this.createdAt);
    }
    
    if (this.updatedAt && (typeof this.updatedAt === 'string' || isNaN(new Date(this.updatedAt)))) {
      this.updatedAt = cleanInvalidDate(this.updatedAt);
    }
    
    if (this.lastTriageDate && (typeof this.lastTriageDate === 'string' || isNaN(new Date(this.lastTriageDate)))) {
      this.lastTriageDate = cleanInvalidDate(this.lastTriageDate);
    }
    
    if (this.dateOfBirth && (typeof this.dateOfBirth === 'string' || isNaN(new Date(this.dateOfBirth)))) {
      this.dateOfBirth = cleanInvalidDate(this.dateOfBirth);
    }
    
    // Auto-migrar nombres si es necesario
    const migrationResult = this.migrateNameIfNeeded();
    
    // Actualizar updatedAt
    this.updatedAt = new Date();
    
    next();
  } catch (error) {
    console.error(`❌ Error en pre-save para ${this.userId}:`, error);
    next(error);
  }
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

// 📊 Método para obtener resumen del paciente (ACTUALIZADO)
userSchema.methods.getPatientSummary = function() {
  // Auto-migrar antes de devolver summary
  this.migrateNameIfNeeded();
  
  return {
    _id: this._id,
    userId: this.userId,
    
    // 🆕 CAMPOS ACTUALIZADOS
    firstName: this.firstName,
    lastName: this.lastName,
    motherLastName: this.motherLastName,
    fullName: this.fullName,        // Virtual field
    displayName: this.displayName,  // Virtual field
    
    // 🔄 MANTENER COMPATIBILIDAD
    name: this.fullName,  // Para componentes que aún usan 'name'
    
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

// 🔍 MÉTODO ESTÁTICO MEJORADO - Con manejo de errores de fechas
userSchema.statics.findWithMigration = async function(query = {}) {
  try {
    const users = await this.find(query);
    
    // Auto-migrar users que lo necesiten
    const usersToSave = [];
    
    for (const user of users) {
      try {
        const migrationResult = user.migrateNameIfNeeded();
        
        // Si necesita guardarse (nombres o fechas migrados)
        if (migrationResult.needsSave) {
          usersToSave.push(user);
        }
      } catch (migrationError) {
        console.error(`⚠️ Error migrando usuario ${user.userId}:`, migrationError.message);
        // Continuar con otros usuarios
        continue;
      }
    }
    
    // Guardar usuarios migrados con manejo de errores individual
    if (usersToSave.length > 0) {
      let savedCount = 0;
      let errorCount = 0;
      
      for (const user of usersToSave) {
        try {
          await user.save();
          savedCount++;
        } catch (saveError) {
          console.error(`❌ Error guardando usuario migrado ${user.userId}:`, saveError.message);
          errorCount++;
          
          // Si el error es de fecha, intentar limpiar y guardar de nuevo
          if (saveError.message.includes('Cast to date failed')) {
            try {
              console.log(`🔧 Intentando limpieza de fechas para ${user.userId}`);
              user.createdAt = cleanInvalidDate(user.createdAt);
              user.updatedAt = cleanInvalidDate(user.updatedAt);
              if (user.lastTriageDate) user.lastTriageDate = cleanInvalidDate(user.lastTriageDate);
              if (user.dateOfBirth) user.dateOfBirth = cleanInvalidDate(user.dateOfBirth);
              
              await user.save();
              savedCount++;
              console.log(`✅ Usuario ${user.userId} guardado después de limpieza de fechas`);
            } catch (retryError) {
              console.error(`❌ Error después de limpieza de fechas para ${user.userId}:`, retryError.message);
            }
          }
        }
      }
      
      console.log(`✅ Auto-migración completada: ${savedCount} usuarios guardados, ${errorCount} errores`);
    }
    
    return users;
    
  } catch (error) {
    console.error('❌ Error en findWithMigration:', error);
    throw error;
  }
};

// Asegurar que los campos virtuales se incluyan en JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model("User", userSchema);
export default User;