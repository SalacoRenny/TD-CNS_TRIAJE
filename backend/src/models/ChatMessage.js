// ===============================================
// 💬 CHAT MESSAGE MODEL - MENSAJES INDIVIDUALES
// backend/src/models/ChatMessage.js
// ===============================================

import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  // 🆔 Identificadores
  messageId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  conversationId: {
    type: String,
    required: true,
    ref: 'Conversation',
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },

  // 📝 Contenido del mensaje
  sender: {
    type: String,
    enum: ['user', 'watson'],
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'question', 'alert', 'summary', 'welcome', 'followup', 'emergency', 'classification'],
    default: 'text',
    index: true
  },

  // ⏰ Información temporal
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  messageSequence: {
    type: Number,
    required: true,
    index: true
  },

  // 🧠 Datos específicos de Watson
  watsonResponse: {
    // Respuesta completa de Watson
    rawResponse: mongoose.Schema.Types.Mixed,
    
    // Información de procesamiento
    processingTime: {
      type: Number,
      default: 0
    },
    tokensUsed: {
      type: Number,
      default: 0
    },
    modelVersion: {
      type: String,
      default: 'llama-3-3-70b-instruct'
    },
    
    // Contexto enviado a Watson
    contextSent: {
      type: String,
      default: ''
    },
    
    // Prompt específico usado
    promptType: {
      type: String,
      enum: ['initial', 'followup', 'symptom_inquiry', 'classification', 'emergency'],
      default: 'followup'
    }
  },

  // 🚨 Información de urgencia
  urgencyUpdate: {
    type: Boolean,
    default: false
  },
  urgencyChanged: {
    previousLevel: Number,
    newLevel: Number,
    reason: String
  },

  // 🎯 Análisis del mensaje
  extractedInfo: {
    // Síntomas mencionados
    symptoms: [{
      type: String
    }],
    
    // Condiciones médicas mencionadas
    conditions: [{
      type: String
    }],
    
    // Información vital
    vitalSigns: {
      temperature: String,
      bloodPressure: String,
      heartRate: String,
      other: String
    },
    
    // Factores temporales
    timeFactors: {
      duration: String,
      onset: String,
      progression: String
    },
    
    // Nivel de dolor si se menciona
    painLevel: {
      type: Number,
      min: 0,
      max: 10
    }
  },

  // 🤖 Intención detectada por Watson
  detectedIntent: {
    type: String,
    enum: [
      'symptom_description',
      'pain_assessment', 
      'medical_history',
      'medication_inquiry',
      'temporal_information',
      'severity_assessment',
      'emergency_signal',
      'clarification_request',
      'general_inquiry'
    ]
  },

  // 📊 Metadatos del mensaje
  messageMetadata: {
    // Si Watson sugirió preguntas de seguimiento
    suggestedFollowups: [{
      question: String,
      priority: {
        type: String,
        enum: ['high', 'medium', 'low'],
        default: 'medium'
      }
    }],
    
    // Si este mensaje activó alguna alerta
    triggeredAlerts: [{
      type: String,
      severity: String,
      message: String
    }],
    
    // Confianza en la respuesta de Watson
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    },
    
    // Si Watson necesitó fallback
    usedFallback: {
      type: Boolean,
      default: false
    },
    fallbackReason: {
      type: String,
      default: ''
    }
  },

  // 🔄 Relación con otros mensajes
  referencesMessageId: {
    type: String,
    default: null
  },
  isFollowupTo: {
    type: String,
    default: null
  },

  // 🎨 Presentación en UI
  displayProperties: {
    showTypingDelay: {
      type: Boolean,
      default: true
    },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent', 'critical'],
      default: 'normal'
    },
    requiresAttention: {
      type: Boolean,
      default: false
    }
  },

  // 📝 Estado del mensaje
  messageStatus: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'processed', 'error'],
    default: 'sent'
  },

  // 📊 Análisis de calidad
  qualityMetrics: {
    relevance: {
      type: Number,
      min: 0,
      max: 1
    },
    clarity: {
      type: Number,
      min: 0,
      max: 1
    },
    medicalAccuracy: {
      type: Number,
      min: 0,
      max: 1
    }
  },

  // 📝 Timestamps adicionales
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
  collection: 'chat_messages'
});

// 📊 Índices para optimización
chatMessageSchema.index({ conversationId: 1, messageSequence: 1 });
chatMessageSchema.index({ userId: 1, timestamp: -1 });
chatMessageSchema.index({ sender: 1, messageType: 1 });
chatMessageSchema.index({ messageType: 1, urgencyUpdate: 1 });
chatMessageSchema.index({ timestamp: -1 });

// 🔄 Middleware pre-save
chatMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-incrementar sequence si es nuevo mensaje
  if (this.isNew && !this.messageSequence) {
    ChatMessage.countDocuments({ conversationId: this.conversationId })
      .then(count => {
        this.messageSequence = count + 1;
        next();
      })
      .catch(next);
  } else {
    next();
  }
});

// 📈 Métodos del modelo
chatMessageSchema.methods.markAsUrgent = function(reason) {
  this.urgencyUpdate = true;
  this.displayProperties.priority = 'urgent';
  this.displayProperties.requiresAttention = true;
  
  if (!this.messageMetadata.triggeredAlerts) {
    this.messageMetadata.triggeredAlerts = [];
  }
  
  this.messageMetadata.triggeredAlerts.push({
    type: 'urgency_escalation',
    severity: 'high',
    message: reason
  });
  
  return this.save();
};

chatMessageSchema.methods.addExtractedSymptom = function(symptom) {
  if (!this.extractedInfo.symptoms.includes(symptom.toLowerCase())) {
    this.extractedInfo.symptoms.push(symptom.toLowerCase());
  }
  return this.save();
};

chatMessageSchema.methods.setWatsonResponse = function(response, processingTime, tokensUsed) {
  this.watsonResponse.rawResponse = response;
  this.watsonResponse.processingTime = processingTime;
  this.watsonResponse.tokensUsed = tokensUsed;
  this.messageStatus = 'processed';
  return this.save();
};

// 🔍 Métodos estáticos
chatMessageSchema.statics.getConversationMessages = function(conversationId, limit = 50) {
  return this.find({ conversationId })
    .sort({ messageSequence: 1 })
    .limit(limit)
    .select('-watsonResponse.rawResponse -watsonResponse.contextSent');
};

chatMessageSchema.statics.getLatestUserMessage = function(conversationId) {
  return this.findOne({ 
    conversationId, 
    sender: 'user' 
  }).sort({ messageSequence: -1 });
};

chatMessageSchema.statics.getUrgentMessages = function(limit = 10) {
  return this.find({ 
    urgencyUpdate: true,
    'displayProperties.priority': { $in: ['urgent', 'critical'] }
  })
  .sort({ timestamp: -1 })
  .limit(limit)
  .populate('conversationId', 'userId currentUrgencyLevel');
};

chatMessageSchema.statics.getConversationSummary = function(conversationId) {
  return this.aggregate([
    { $match: { conversationId } },
    {
      $group: {
        _id: '$sender',
        messageCount: { $sum: 1 },
        totalTokens: { $sum: '$watsonResponse.tokensUsed' },
        avgProcessingTime: { $avg: '$watsonResponse.processingTime' },
        urgencyUpdates: { $sum: { $cond: ['$urgencyUpdate', 1, 0] } }
      }
    }
  ]);
};

chatMessageSchema.statics.findMessagesByIntent = function(conversationId, intent) {
  return this.find({ 
    conversationId,
    detectedIntent: intent 
  }).sort({ messageSequence: 1 });
};

chatMessageSchema.statics.getTokenUsageStats = function(userId, dateFrom, dateTo) {
  const matchStage = { 
    userId,
    sender: 'watson',
    'watsonResponse.tokensUsed': { $gt: 0 }
  };
  
  if (dateFrom || dateTo) {
    matchStage.timestamp = {};
    if (dateFrom) matchStage.timestamp.$gte = new Date(dateFrom);
    if (dateTo) matchStage.timestamp.$lte = new Date(dateTo);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalTokens: { $sum: '$watsonResponse.tokensUsed' },
        totalMessages: { $sum: 1 },
        avgTokensPerMessage: { $avg: '$watsonResponse.tokensUsed' },
        totalProcessingTime: { $sum: '$watsonResponse.processingTime' }
      }
    }
  ]);
};

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

export default ChatMessage;