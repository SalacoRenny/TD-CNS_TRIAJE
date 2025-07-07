// ===============================================
// 📋 SYMPTOM RECORD MODEL - EXPANDIDO PARA WATSON CHAT
// backend/src/models/SymptomRecord.js
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

  // 🆕 NUEVOS CAMPOS WATSON (expandir para compatibilidad completa)
  
  // ID de sesión único
  sessionId: {
    type: String,
    default: null
  },
  
  // Respuesta completa de Watson
  watson_response: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Método de clasificación usado
  classification_method: {
    type: String,
    enum: ['watson', 'simple', 'watson_fallback', 'watson_chat'],
    default: 'simple'
  },
  
  // Clasificación final procesada
  final_classification: {
    level: Number,
    color: String,
    label: String,
    bgColor: String,
    specialty: String,
    source: String,
    confidence: Number
  },
  
  // Contexto enviado a Watson
  context_sent_to_watson: {
    type: String,
    default: ''
  },
  
  // ID de sesión anterior (para memoria contextual)
  previous_session_id: {
    type: String,
    default: null
  },
  
  // Secuencia en la sesión
  session_sequence: {
    type: Number,
    default: 1
  },
  
  // Si es consulta de seguimiento
  is_follow_up: {
    type: Boolean,
    default: false
  },
  
  // Tiempo de procesamiento en milisegundos
  processing_time_ms: {
    type: Number,
    default: 0
  },
  
  // Score de confianza de la clasificación
  confidence_score: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8
  },
  
  // Tokens Watson utilizados
  watson_tokens_used: {
    type: Number,
    default: 0
  },
  
  // Razón del fallback si aplica
  fallback_reason: {
    type: String,
    default: ''
  },

  // 🆕 CAMPOS ESPECÍFICOS PARA WATSON CHAT
  
  // ID de conversación relacionada
  conversation_id: {
    type: String,
    default: null
  },
  
  // Número de intercambios en la conversación
  conversation_turns: {
    type: Number,
    default: 0
  },
  
  // Si tuvo contexto histórico del paciente
  had_historical_context: {
    type: Boolean,
    default: false
  },
  
  // Número de consultas previas consideradas
  historical_consultations_count: {
    type: Number,
    default: 0
  },
  
  // Fase de conversación en la que se clasificó
  classification_phase: {
    type: Number,
    default: 4
  },
  
  // Resumen de la conversación
  conversation_summary: {
    type: String,
    default: ''
  }
});

// 📊 Índices para optimización (mantener + agregar nuevos)
SymptomRecordSchema.index({ userId: 1, createdAt: -1 });
SymptomRecordSchema.index({ sessionId: 1 });
SymptomRecordSchema.index({ conversation_id: 1 });
SymptomRecordSchema.index({ classification_method: 1 });
SymptomRecordSchema.index({ is_follow_up: 1, userId: 1 });

const SymptomRecord = mongoose.model("SymptomRecord", SymptomRecordSchema);
export default SymptomRecord;