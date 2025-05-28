// backend/src/models/SymptomRecord.js
import mongoose from 'mongoose';

const symptomRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: {
    type: String,
    required: true,
    trim: true
  },
  preExistingConditions: {
    type: String,
    trim: true
  },
  temperature: {
    type: Number,
    min: 30,
    max: 45
  },
  additionalNotes: {
    type: String,
    trim: true
  },
  // Nuevos campos para el triaje
  priority: {
    type: String,
    enum: ['muy-alta', 'alta', 'media', 'baja', 'muy-baja'],
    default: 'media'
  },
  status: {
    type: String,
    enum: ['waiting', 'in-progress', 'attended', 'completed', 'cancelled'],
    default: 'waiting'
  },
  // Campos para tracking médico
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  attendedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },
  // Campo para sugerencia de especialidad (cuando integres Watson)
  suggestedSpecialty: {
    type: String,
    default: null
  },
  // Campo para el resultado del triaje IA
  triageResult: {
    color: {
      type: String,
      enum: ['rojo', 'naranja', 'amarillo', 'verde', 'azul', null],
      default: null
    },
    description: String,
    aiConfidence: Number
  }
}, {
  timestamps: true
});

// Índices para mejorar las consultas
symptomRecordSchema.index({ userId: 1, createdAt: -1 });
symptomRecordSchema.index({ status: 1, priority: -1 });
symptomRecordSchema.index({ createdAt: -1 });

export default mongoose.model('SymptomRecord', symptomRecordSchema);