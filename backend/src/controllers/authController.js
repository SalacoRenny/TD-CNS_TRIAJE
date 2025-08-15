import User from "../models/User.js";
import bcrypt from "bcrypt";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 🔍 USAR findWithMigration para auto-migración
    const users = await User.findWithMigration({ email });
    const user = users[0];
    
    if (!user) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // ✅ RESPUESTA CORREGIDA - Usar campos virtuales y compatibilidad total
    res.status(200).json({
      id: user.userId,        
      userId: user.userId,    
      name: user.fullName,        // ✅ Usar virtual field fullName
      fullName: user.fullName,    // ✅ Consistente con virtual field
      firstName: user.firstName,
      lastName: user.lastName,
      motherLastName: user.motherLastName,
      displayName: user.displayName, // ✅ Agregar displayName virtual
      email: user.email,
      ci: user.ci,
      role: user.role,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      age: user.age,
      gender: user.gender
    });

  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// 🆕 FUNCIÓN DE REGISTRO CORREGIDA
export const registerUser = async (req, res) => {
  try {
    console.log("🆕 Registrando nuevo usuario...");
    
    const { 
      firstName, 
      lastName, 
      motherLastName, 
      email, 
      ci, 
      password,
      phone,
      dateOfBirth,
      gender,
      role = "asegurado" // Default a asegurado
    } = req.body;

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !ci || !password) {
      return res.status(400).json({ 
        error: "Faltan campos requeridos: firstName, lastName, email, ci, password" 
      });
    }

    // 🔍 VALIDAR CON findWithMigration para evitar duplicados
    const existingEmail = await User.findWithMigration({ email });
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email ya registrado" });
    }

    const existingCI = await User.findWithMigration({ ci });
    if (existingCI.length > 0) {
      return res.status(400).json({ error: "CI ya registrado" });
    }

    // 🆕 GENERAR userId AUTOMÁTICO
    const lastUser = await User.findOne({}).sort({ createdAt: -1 });
    let nextNumber = 1;
    
    if (lastUser && lastUser.userId) {
      const lastNumber = parseInt(lastUser.userId.replace('CNS', ''));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    
    const userId = `CNS${nextNumber.toString().padStart(3, '0')}`;
    console.log(`🆔 Generando userId: ${userId}`);

    // Preparar datos del usuario
    const userData = {
      userId,
      firstName,
      lastName,
      motherLastName: motherLastName || "",
      email,
      ci,
      password,
      phone: phone || "",
      dateOfBirth: dateOfBirth || null,
      gender: gender || "",
      role: ["asegurado", "personal_medico", "asistente"].includes(role) ? role : "asegurado",
      status: "registrado"
    };

    const newUser = new User(userData);
    await newUser.save();

    // ✅ RESPUESTA CORREGIDA - Usar getPatientSummary() para consistencia
    const userResponse = newUser.getPatientSummary();

    console.log(`✅ Usuario registrado: ${newUser.fullName} (${userId})`);
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: userResponse
    });

  } catch (error) {
    console.error("❌ Error registrando usuario:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      res.status(400).json({ 
        error: `Ya existe un usuario con ese ${field === 'email' ? 'email' : field}` 
      });
    } else {
      res.status(500).json({ error: "Error del servidor" });
    }
  }
};

// 🔄 FUNCIÓN SYNC CORREGIDA
export const syncUserData = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 Sincronizando datos del usuario: ${userId}`);
    
    // 🔍 USAR findWithMigration para auto-migración
    const users = await User.findWithMigration({ userId, isActive: true });
    const user = users[0];
    
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    // ✅ USAR getPatientSummary() para consistencia total
    const userData = user.getPatientSummary();
    
    console.log(`✅ Datos sincronizados para: ${user.fullName}`);
    res.status(200).json(userData);
    
  } catch (error) {
    console.error("❌ Error sincronizando usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};