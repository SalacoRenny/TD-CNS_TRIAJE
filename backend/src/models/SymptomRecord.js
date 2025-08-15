// ===============================================
// 📋 SYMPTOM RECORD MODEL - EXPANDIDO PARA SIGNOS VITALES
// backend/src/models/SymptomRecord.js (FASE 1.2 ACTUALIZADA)
// ===============================================

import mongoose from "mongoose";

const SymptomRecordSchema = new mongoose.Schema({
  // ✅ CAMPOS ORIGINALES (mantener tal como están)
  userId: { type: String, required: true },
  symptoms: { type: [String], required: true },
  baseConditions: { type: [String], default: [] },
  notes: { type: String },
  temperature: { type: String, default: "" },
  timestamp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },

  // 🆕 NUEVOS CAMPOS SIGNOS VITALES - FASE 1.2
  // Campos críticos para AISANA
  edad: {
    type: Number,
    min: 0,
    max: 120,
    default: null
  },
  
  frecuenciaCardiaca: {
    type: Number,
    min: 30,
    max: 220,
    default: null,
    // Alias para compatibilidad
    alias: 'heartRate'
  },
  
  presionArterial: {
    sistolica: {
      type: Number,
      min: 70,
      max: 250,
      default: null
    },
    diastolica: {
      type: Number,
      min: 40,
      max: 150,
      default: null
    },
    // Campo de texto para captura manual "120/80"
    texto: {
      type: String,
      default: ""
    }
  },

  // ✅ CAMPOS WATSON EXISTENTES (mantener)
  sessionId: { type: String, default: null },
  watson_response: { type: mongoose.Schema.Types.Mixed, default: null },
  classification_method: {
    type: String,
    enum: ['watson', 'simple', 'watson_fallback', 'watson_chat'],
    default: 'simple'
  },
  
  final_classification: {
    level: Number,
    color: String,
    label: String,
    bgColor: String,
    specialty: String,
    source: String,
    confidence: Number
  },
  
  context_sent_to_watson: { type: String, default: '' },
  previous_session_id: { type: String, default: null },
  session_sequence: { type: Number, default: 1 },
  is_follow_up: { type: Boolean, default: false },
  processing_time_ms: { type: Number, default: 0 },
  confidence_score: { type: Number, min: 0, max: 1, default: 0.8 },
  watson_tokens_used: { type: Number, default: 0 },
  fallback_reason: { type: String, default: '' },

  // ✅ CAMPOS WATSON CHAT EXISTENTES (mantener)
  conversation_id: { type: String, default: null },
  conversation_turns: { type: Number, default: 0 },
  had_historical_context: { type: Boolean, default: false },
  historical_consultations_count: { type: Number, default: 0 },
  classification_phase: { type: Number, default: 4 },

  // ✅ CAMPOS MÉDICOS EXISTENTES (mantener)
  attention_status: {
  type: String,
  enum: ['pending', 'waiting', 'in_progress', 'completed', 'dismissed'],
  default: 'pending'
},
  attention_updated_at: { type: Date, default: Date.now },

  attending_doctor: {
    id: { type: String, default: null },
    name: { type: String, default: null },
    assigned_at: { type: Date, default: null }
  },

  completed_by_doctor: {
    id: { type: String, default: null },
    name: { type: String, default: null },
    completed_at: { type: Date, default: null }
  },
  dismissed_by_doctor: {
  id: { type: String, default: null },
  name: { type: String, default: null },
  dismissed_at: { type: Date, default: null }
},
  doctor_history: [{
    doctor_id: String,
    doctor_name: String,
    action: {
      type: String,
      enum: ['assigned', 'completed', 'transferred', 'reviewed'],
      required: true
    },
    timestamp: { type: Date, default: Date.now },
    notes: String
  }],

  state_duration: {
    pending_minutes: { type: Number, default: 0 },
    in_progress_minutes: { type: Number, default: 0 },
    completed_minutes: { type: Number, default: 0 }
  },
  

  conversation_summary: { type: String, default: '' },

    // 🆕 CAMPOS PARA ASISTENTE MÉDICO
  assistedBy: {
    assistantId: { type: String, default: null },
    assistantName: { type: String, default: null },
    assistantRole: { type: String, default: null },
    timestamp: { type: Date, default: null }
  },
  isAssisted: { type: Boolean, default: false }
  
});

// 📊 ÍNDICES EXISTENTES + NUEVOS PARA SIGNOS VITALES
SymptomRecordSchema.index({ userId: 1, createdAt: -1 });
SymptomRecordSchema.index({ sessionId: 1 });
SymptomRecordSchema.index({ conversation_id: 1 });
SymptomRecordSchema.index({ classification_method: 1 });
SymptomRecordSchema.index({ is_follow_up: 1, userId: 1 });

// 🆕 ÍNDICE PARA ASISTENCIAS
SymptomRecordSchema.index({ 'assistedBy.assistantId': 1, createdAt: -1 });
SymptomRecordSchema.index({ isAssisted: 1 });

// 🆕 ÍNDICES PARA SIGNOS VITALES
SymptomRecordSchema.index({ edad: 1 });
SymptomRecordSchema.index({ frecuenciaCardiaca: 1 });
SymptomRecordSchema.index({ 'presionArterial.sistolica': 1 });

// ÍNDICES MÉDICOS
SymptomRecordSchema.index({ attention_status: 1, createdAt: -1 });
SymptomRecordSchema.index({ 'attending_doctor.id': 1 });
SymptomRecordSchema.index({ 'completed_by_doctor.id': 1 });
SymptomRecordSchema.index({ attention_updated_at: -1 });

// 🆕 MÉTODOS VIRTUALES PARA SIGNOS VITALES
SymptomRecordSchema.virtual('heartRate').get(function() {
  return this.frecuenciaCardiaca;
});

SymptomRecordSchema.virtual('bloodPressure').get(function() {
  if (this.presionArterial.texto) return this.presionArterial.texto;
  if (this.presionArterial.sistolica && this.presionArterial.diastolica) {
    return `${this.presionArterial.sistolica}/${this.presionArterial.diastolica}`;
  }
  return null;
});

SymptomRecordSchema.virtual('age').get(function() {
  return this.edad;
});

// 🆕 MÉTODO: Evaluar signos vitales críticos
SymptomRecordSchema.methods.evaluateVitalSigns = function() {
  const alerts = [];
  
  // Evaluar temperatura
  if (this.temperature) {
    const temp = parseFloat(this.temperature);
    if (temp >= 39.5) alerts.push({ type: 'critical', vital: 'temperature', value: temp, message: 'Fiebre muy alta' });
    else if (temp >= 38.5) alerts.push({ type: 'warning', vital: 'temperature', value: temp, message: 'Fiebre alta' });
    else if (temp <= 35.0) alerts.push({ type: 'warning', vital: 'temperature', value: temp, message: 'Hipotermia' });
  }
  
  // Evaluar frecuencia cardíaca
  if (this.frecuenciaCardiaca) {
    const fc = this.frecuenciaCardiaca;
    if (fc >= 120) alerts.push({ type: 'warning', vital: 'heartRate', value: fc, message: 'Taquicardia' });
    else if (fc <= 50) alerts.push({ type: 'warning', vital: 'heartRate', value: fc, message: 'Bradicardia' });
  }
  
  // Evaluar presión arterial
  if (this.presionArterial.sistolica && this.presionArterial.diastolica) {
    const sistolica = this.presionArterial.sistolica;
    const diastolica = this.presionArterial.diastolica;
    
    if (sistolica >= 180 || diastolica >= 110) {
      alerts.push({ type: 'critical', vital: 'bloodPressure', value: `${sistolica}/${diastolica}`, message: 'Hipertensión severa' });
    } else if (sistolica >= 140 || diastolica >= 90) {
      alerts.push({ type: 'warning', vital: 'bloodPressure', value: `${sistolica}/${diastolica}`, message: 'Hipertensión' });
    } else if (sistolica <= 90 || diastolica <= 60) {
      alerts.push({ type: 'warning', vital: 'bloodPressure', value: `${sistolica}/${diastolica}`, message: 'Hipotensión' });
    }
  }
  
  return alerts;
};

// 🆕 MÉTODO: Calcular score de riesgo basado en signos vitales
SymptomRecordSchema.methods.calculateVitalSignsRisk = function() {
  let riskScore = 0;
  const alerts = this.evaluateVitalSigns();
  
  alerts.forEach(alert => {
    if (alert.type === 'critical') riskScore += 3;
    else if (alert.type === 'warning') riskScore += 1;
  });
  
  // Evaluar edad como factor de riesgo
  if (this.edad >= 65) riskScore += 1;
  else if (this.edad >= 80) riskScore += 2;
  
  return {
    score: riskScore,
    level: riskScore >= 4 ? 'high' : riskScore >= 2 ? 'medium' : 'low',
    alerts: alerts
  };
};

// 🆕 MÉTODO: Obtener resumen de signos vitales para Watson
SymptomRecordSchema.methods.getVitalSignsSummary = function() {
  const vitals = [];
  
  if (this.edad) vitals.push(`Edad: ${this.edad} años`);
  if (this.temperature) vitals.push(`Temperatura: ${this.temperature}°C`);
  if (this.frecuenciaCardiaca) vitals.push(`FC: ${this.frecuenciaCardiaca} lpm`);
  if (this.bloodPressure) vitals.push(`PA: ${this.bloodPressure} mmHg`);
  
  return vitals.length > 0 ? vitals.join(', ') : 'Sin signos vitales registrados';
};

// ✅ MÉTODOS EXISTENTES (mantener)
SymptomRecordSchema.pre('findOneAndUpdate', function() {
  const update = this.getUpdate();
  if (update.attention_status) {
    update.attention_updated_at = new Date();
  }
});

SymptomRecordSchema.methods.addDoctorAction = function(doctorId, doctorName, action, notes = '') {
  this.doctor_history.push({
    doctor_id: doctorId,
    doctor_name: doctorName,
    action: action,
    timestamp: new Date(),
    notes: notes
  });
  return this.save();
};

SymptomRecordSchema.methods.getCurrentDoctorInfo = function() {
  if (this.attention_status === 'in_progress' && this.attending_doctor) {
    return { type: 'attending', doctor: this.attending_doctor };
  }
  if (this.attention_status === 'completed' && this.completed_by_doctor) {
    return { type: 'completed', doctor: this.completed_by_doctor };
  }
  return null;
};

SymptomRecordSchema.methods.getStateDuration = function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const totalMinutes = Math.floor((now - created) / (1000 * 60));
  
  return {
    total_minutes: totalMinutes,
    current_state: this.attention_status,
    current_state_duration: Math.floor((now - new Date(this.attention_updated_at)) / (1000 * 60))
  };
};

// 🆕 MIDDLEWARE: Validación de signos vitales antes de guardar
SymptomRecordSchema.pre('save', function(next) {
  // Validar presión arterial si se proporciona en texto
  if (this.presionArterial.texto && !this.presionArterial.sistolica) {
    const match = this.presionArterial.texto.match(/(\d+)\/(\d+)/);
    if (match) {
      this.presionArterial.sistolica = parseInt(match[1]);
      this.presionArterial.diastolica = parseInt(match[2]);
    }
  }
  
  next();
});

const SymptomRecord = mongoose.model("SymptomRecord", SymptomRecordSchema);
export default SymptomRecord;