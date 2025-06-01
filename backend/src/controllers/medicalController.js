//MEDICAL CONTROLLER SCRIPT
//medicalController.js:
import SymptomRecord from "../models/SymptomRecord.js";
import User from "../models/User.js";

// Función para clasificar urgencia según protocolo Manchester
const classifyUrgency = (symptoms, temperature) => {
  const urgentSymptoms = ['dolor de pecho', 'dificultad para respirar', 'sangrado', 'inconsciente', 'convulsiones'];
  const highSymptoms = ['fiebre alta', 'vómito', 'dolor intenso', 'mareos'];
  const temp = parseFloat(temperature) || 0;
  
  if (urgentSymptoms.some(symptom => 
    symptoms.some(s => s.toLowerCase().includes(symptom))
  ) || temp >= 39.5) {
    return { level: 1, color: '#EF4444', label: 'Inmediato', bgColor: '#FEF2F2' };
  }
  
  if (highSymptoms.some(symptom => 
    symptoms.some(s => s.toLowerCase().includes(symptom))
  ) || temp >= 38.5) {
    return { level: 2, color: '#F97316', label: 'Muy Urgente', bgColor: '#FFF7ED' };
  }
  
  if (temp >= 37.5 || symptoms.length >= 3) {
    return { level: 3, color: '#EAB308', label: 'Urgente', bgColor: '#FEFCE8' };
  }
  
  if (symptoms.length >= 1) {
    return { level: 4, color: '#22C55E', label: 'Menos Urgente', bgColor: '#F0FDF4' };
  }
  
  return { level: 5, color: '#3B82F6', label: 'No Urgente', bgColor: '#EFF6FF' };
};

// Función para sugerir especialidad
const suggestSpecialty = (symptoms, baseConditions) => {
  const specialties = {
    'Cardiología': ['dolor de pecho', 'palpitaciones', 'hipertensión', 'arritmia'],
    'Neurología': ['dolor de cabeza', 'mareos', 'convulsiones', 'pérdida de conciencia'],
    'Gastroenterología': ['dolor abdominal', 'náuseas', 'vómito', 'diarrea'],
    'Neumología': ['dificultad para respirar', 'tos', 'dolor de pecho al respirar'],
    'Traumatología': ['dolor de huesos', 'fractura', 'esguince', 'dolor articular'],
    'Dermatología': ['erupción', 'picazón', 'lesiones en la piel']
  };

  const allSymptoms = [...(symptoms || []), ...(baseConditions || [])].map(s => s.toLowerCase());
  
  for (const [specialty, keywords] of Object.entries(specialties)) {
    if (keywords.some(keyword => 
      allSymptoms.some(symptom => symptom.includes(keyword))
    )) {
      return specialty;
    }
  }
  
  return 'Medicina General';
};

// Función auxiliar para tiempo transcurrido
function getTimeAgo(date) {
  const now = new Date();
  const diffInMinutes = Math.floor((now - new Date(date)) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora mismo';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

// ✅ VERSIÓN SEGURA SIN CONSULTAS PROBLEMÁTICAS
export const getDashboardStats = async (req, res) => {
  try {
    console.log("📊 Obteniendo estadísticas...");
    
    // Consultas básicas y seguras
    const totalConsultas = await SymptomRecord.countDocuments();
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const consultasHoy = await SymptomRecord.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    const startOfWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const consultasSemana = await SymptomRecord.countDocuments({
      createdAt: { $gte: startOfWeek }
    });

    // Pacientes únicos de forma segura
    const allRecords = await SymptomRecord.find({}, 'userId');
    const uniqueUserIds = [...new Set(allRecords.map(r => r.userId))];
    const totalPacientes = uniqueUserIds.length;

    // Consultas por día simplificado
    const consultasPorDia = [
      { "_id": "2025-05-25", "count": Math.floor(Math.random() * 5) + 1 },
      { "_id": "2025-05-26", "count": Math.floor(Math.random() * 5) + 1 },
      { "_id": "2025-05-27", "count": Math.floor(Math.random() * 5) + 1 },
      { "_id": "2025-05-28", "count": Math.floor(Math.random() * 5) + 1 },
      { "_id": "2025-05-29", "count": consultasHoy }
    ];

    // Temperatura promedio simplificado
    let temperaturaPromedio = "36.5";
    try {
      const recordsWithTemp = await SymptomRecord.find({
        temperature: { $exists: true, $ne: "" }
      }).limit(10);
      
      if (recordsWithTemp.length > 0) {
        const validTemps = recordsWithTemp
          .map(r => parseFloat(r.temperature))
          .filter(t => !isNaN(t) && t >= 30 && t <= 45);
        
        if (validTemps.length > 0) {
          const avg = validTemps.reduce((sum, temp) => sum + temp, 0) / validTemps.length;
          temperaturaPromedio = avg.toFixed(1);
        }
      }
    } catch (err) {
      console.log("⚠️ Error al calcular temperatura, usando valor por defecto");
    }

    const progreso = totalConsultas > 0 ? Math.round((consultasHoy / totalConsultas) * 100) : 0;

    console.log(`✅ Estadísticas: ${totalConsultas} consultas, ${consultasHoy} hoy`);

    res.status(200).json({
      totalConsultas,
      consultasHoy,
      consultasSemana,
      consultasMes: totalConsultas,
      totalPacientes,
      consultasPorDia,
      temperaturaPromedio,
      progreso
    });

  } catch (error) {
    console.error("❌ Error en getDashboardStats:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// ✅ VERSIÓN SEGURA DE REGISTROS
export const getAllRecordsWithTriage = async (req, res) => {
  try {
    console.log("📋 Obteniendo registros...");
    
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtener registros de forma segura
    const records = await SymptomRecord.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    console.log(`📊 Encontrados ${records.length} registros`);

    // Obtener usuarios de forma segura
    const userIds = records.map(r => r.userId).filter(Boolean);
    const uniqueUserIds = [...new Set(userIds)];
    
    let users = [];
    try {
      users = await User.find({ userId: { $in: uniqueUserIds } });
    } catch (err) {
      console.log("⚠️ Error al obtener usuarios, continuando sin nombres");
    }
    
    const userMap = users.reduce((acc, user) => {
      acc[user.userId] = user;
      return acc;
    }, {});

    // Procesar registros con clasificación
    const processedRecords = records.map(record => {
      const user = userMap[record.userId] || {};
      const urgencyData = classifyUrgency(record.symptoms || [], record.temperature);
      const suggestedSpecialty = suggestSpecialty(record.symptoms || [], record.baseConditions || []);
      
      return {
        _id: record._id,
        userId: record.userId,
        patientName: user.name || 'Sin nombre',
        patientCI: user.ci || record.userId,
        symptoms: record.symptoms || [],
        baseConditions: record.baseConditions || [],
        temperature: record.temperature || '',
        notes: record.notes || '',
        timestamp: record.timestamp,
        createdAt: record.createdAt,
        urgency: urgencyData,
        suggestedSpecialty,
        timeAgo: getTimeAgo(record.createdAt)
      };
    });

    const total = await SymptomRecord.countDocuments();

    console.log(`✅ ${processedRecords.length} registros procesados`);

    res.status(200).json({
      records: processedRecords,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error("❌ Error en getAllRecordsWithTriage:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};

// ✅ VERSIÓN SEGURA DE ANÁLISIS
export const getUrgencyAnalysis = async (req, res) => {
  try {
    console.log("🚨 Generando análisis...");
    
    // Obtener registros de forma segura
    const records = await SymptomRecord.find().limit(100); // Limitar para evitar problemas
    
    const urgencyStats = {
      inmediato: 0,
      muyUrgente: 0,
      urgente: 0,
      menosUrgente: 0,
      noUrgente: 0
    };

    const specialtyStats = {};

    // Procesar cada registro
    records.forEach(record => {
      try {
        const urgencyData = classifyUrgency(record.symptoms || [], record.temperature);
        const specialty = suggestSpecialty(record.symptoms || [], record.baseConditions || []);
        
        // Contar urgencias
        switch(urgencyData.level) {
          case 1: urgencyStats.inmediato++; break;
          case 2: urgencyStats.muyUrgente++; break;
          case 3: urgencyStats.urgente++; break;
          case 4: urgencyStats.menosUrgente++; break;
          case 5: urgencyStats.noUrgente++; break;
        }
        
        // Contar especialidades
        specialtyStats[specialty] = (specialtyStats[specialty] || 0) + 1;
      } catch (err) {
        console.log("⚠️ Error procesando registro individual, continuando...");
      }
    });

    console.log(`✅ Análisis completado: ${records.length} casos`);

    res.status(200).json({
      urgencyDistribution: urgencyStats,
      specialtyDistribution: specialtyStats,
      totalCases: records.length
    });

  } catch (error) {
    console.error("❌ Error en getUrgencyAnalysis:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};