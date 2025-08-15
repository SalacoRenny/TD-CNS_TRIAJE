// ===============================================
// 🗣️ CONVERSATION MODEL - CHAT TRIAJE WATSON
// backend/src/models/Conversation.js
// ===============================================

import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
  // 🆔 Identificadores
  conversationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },

  // 📊 Estado de la conversación
  status: {
    type: String,
    enum: ['active', 'completed', 'emergency', 'abandoned'],
    default: 'active',
    index: true
  },

  // 🚨 Clasificación en tiempo real
  currentUrgencyLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },
  currentSpecialty: {
    type: String,
    default: 'Medicina General'
  },

  // 📝 Información recopilada
  collectedSymptoms: [{
    type: String
  }],
  collectedConditions: [{
    type: String
  }],
  collectedTemperature: {
    type: String,
    default: ''
  },
  patientAge: {
    type: String,
    default: ''
  },
  patientGender: {
    type: String,
    default: ''
  },

  // ⏰ Timestamps
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },

  // 🎯 Clasificación final Manchester
  finalClassification: {
    level: Number,
    color: String,
    label: String,
    bgColor: String,
    specialty: String,
    source: {
      type: String,
      enum: ['watson', 'simple', 'watson_fallback'],
      default: 'watson'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    }
  },

  // 🧠 Información Watson
  watsonMetadata: {
    totalTokensUsed: {
      type: Number,
      default: 0
    },
    totalProcessingTime: {
      type: Number,
      default: 0
    },
    modelVersion: {
      type: String,
      default: 'llama-3-3-70b-instruct'
    },
    conversationTurns: {
      type: Number,
      default: 0
    }
  },

  // 📋 Resumen y contexto
  conversationSummary: {
    type: String,
    default: ''
  },
  chiefComplaint: {
    type: String,
    default: ''
  },
  clinicalContext: {
    type: String,
    default: ''
  },

  // 🔄 Relación con sesiones anteriores
  previousConversationId: {
    type: String,
    default: null
  },
  isFollowUpConversation: {
    type: Boolean,
    default: false
  },
  conversationSequence: {
    type: Number,
    default: 1
  },

  // 🚨 Alertas y flags especiales
  emergencyDetected: {
    type: Boolean,
    default: false
  },
  emergencyReason: {
    type: String,
    default: ''
  },
  requiresImmediateAttention: {
    type: Boolean,
    default: false
  },

  // 📊 Métricas de calidad
  conversationQuality: {
    completeness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    informationGathered: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    patientSatisfaction: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    }
  },

  // 🔗 Integración con sistema existente
  linkedSymptomRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SymptomRecord',
    default: null
  },

  // 📝 Metadatos adicionales
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'conversations'
});

// 📊 Índices para optimización
conversationSchema.index({ userId: 1, startedAt: -1 });
conversationSchema.index({ status: 1, currentUrgencyLevel: 1 });
conversationSchema.index({ conversationId: 1, userId: 1 });
conversationSchema.index({ emergencyDetected: 1, status: 1 });

// 🔄 Middleware pre-save
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Actualizar lastMessageAt si está activa
  if (this.status === 'active') {
    this.lastMessageAt = new Date();
  }
  
  // Incrementar turns en watsonMetadata si hay nueva actividad
  if (this.isModified('lastMessageAt') && !this.isNew) {
    this.watsonMetadata.conversationTurns += 1;
  }
  
  // Detectar emergencia automáticamente
  if (this.currentUrgencyLevel <= 2 && !this.emergencyDetected) {
    this.emergencyDetected = true;
    this.requiresImmediateAttention = true;
    if (!this.emergencyReason) {
      this.emergencyReason = `Urgencia Nivel ${this.currentUrgencyLevel} detectada automáticamente`;
    }
  }
  
  next();
});

// 📈 Métodos del modelo
conversationSchema.methods.updateUrgency = function(level, specialty, reason) {
  this.currentUrgencyLevel = level;
  this.currentSpecialty = specialty;
  
  if (level <= 2) {
    this.emergencyDetected = true;
    this.requiresImmediateAttention = true;
    this.emergencyReason = reason || `Nivel ${level} - ${specialty}`;
  }
  
  return this.save();
};

conversationSchema.methods.addSymptom = function(symptom) {
  if (!this.collectedSymptoms.includes(symptom.toLowerCase())) {
    this.collectedSymptoms.push(symptom.toLowerCase());
  }
  return this.save();
};

conversationSchema.methods.addCondition = function(condition) {
  if (!this.collectedConditions.includes(condition.toLowerCase())) {
    this.collectedConditions.push(condition.toLowerCase());
  }
  return this.save();
};

conversationSchema.methods.finalize = function(finalClassification) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.finalClassification = finalClassification;
  
  // Calcular completeness de la conversación
  let completeness = 0;
  if (this.collectedSymptoms.length > 0) completeness += 0.3;
  if (this.collectedTemperature) completeness += 0.2;
  if (this.chiefComplaint) completeness += 0.2;
  if (this.clinicalContext) completeness += 0.2;
  if (this.patientAge || this.patientGender) completeness += 0.1;
  
  this.conversationQuality.completeness = completeness;
  this.conversationQuality.informationGathered = Math.min(100, this.watsonMetadata.conversationTurns * 10);
  
  return this.save();
};

// 🔍 Métodos estáticos
conversationSchema.statics.findActiveByUser = function(userId) {
  return this.findOne({ 
    userId, 
    status: 'active' 
  }).sort({ startedAt: -1 });
};

conversationSchema.statics.getEmergencyCases = function(limit = 10) {
  return this.find({ 
    emergencyDetected: true,
    status: { $in: ['active', 'completed'] }
  })
  .sort({ startedAt: -1 })
  .limit(limit);
};

conversationSchema.statics.getUserConversationHistory = function(userId, limit = 5) {
  return this.find({ userId })
    .sort({ startedAt: -1 })
    .limit(limit)
    .select('-watsonMetadata -conversationQuality');
};

conversationSchema.statics.getConversationStats = function(userId) {
  return this.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        emergencyDetections: { $sum: { $cond: ['$emergencyDetected', 1, 0] } },
        avgUrgencyLevel: { $avg: '$currentUrgencyLevel' },
        completedConversations: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalTokensUsed: { $sum: '$watsonMetadata.totalTokensUsed' },
        firstConversation: { $min: '$startedAt' },
        lastConversation: { $max: '$startedAt' }
      }
    }
  ]);
};

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;