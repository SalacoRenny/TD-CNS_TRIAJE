// backend/seed.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

// Cargar variables de entorno
dotenv.config();

// Verificar - usando MONGODB_URI como en tu .env
console.log('🔍 Verificando configuración...');
console.log('MONGODB_URI existe:', !!process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI no encontrado en .env');
  process.exit(1);
}

// Usuarios de prueba
const testUsers = [
  // Personal médico
  {
    insuranceCode: 'MED001',
    fullName: 'Dr. Carlos Mendoza',
    email: 'carlos.mendoza@cns.bo',
    documentNumber: '7890123',
    password: 'medico123',
    userType: 'personal_medico',
    medicalRole: 'medico_triaje',
    specialty: 'Medicina General'
  },
  {
    insuranceCode: 'MED002',
    fullName: 'Dra. Ana Rodriguez',
    email: 'ana.rodriguez@cns.bo',
    documentNumber: '7890124',
    password: 'medico123',
    userType: 'personal_medico',
    medicalRole: 'medico_general',
    specialty: 'Medicina Interna'
  },
  // Pacientes asegurados
  {
    insuranceCode: '1001',
    fullName: 'Juan Pérez García',
    email: 'juan.perez@email.com',
    documentNumber: '1234567',
    password: 'paciente123',
    userType: 'asegurado',
    birthDate: new Date('1990-05-15')
  },
  {
    insuranceCode: '1002',
    fullName: 'María López Flores',
    email: 'maria.lopez@email.com',
    documentNumber: '2345678',
    password: 'paciente123',
    userType: 'asegurado',
    birthDate: new Date('1985-08-20')
  }
];

async function seed() {
  try {
    // Conectar usando MONGODB_URI
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Crear usuarios
    console.log('\n📝 Creando usuarios de prueba...\n');
    
    for (const userData of testUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Creado: ${userData.fullName} (${userData.userType})`);
      } else {
        console.log(`⚠️  Ya existe: ${userData.fullName}`);
      }
    }

    console.log('\n📋 Usuarios de prueba creados:');
    console.log('\n🏥 PERSONAL MÉDICO:');
    console.log('  Email: carlos.mendoza@cns.bo');
    console.log('  Password: medico123');
    console.log('\n  Email: ana.rodriguez@cns.bo');
    console.log('  Password: medico123');
    console.log('\n👥 PACIENTES:');
    console.log('  Email: juan.perez@email.com');
    console.log('  Password: paciente123');
    console.log('\n  Email: maria.lopez@email.com');
    console.log('  Password: paciente123');

    await mongoose.connection.close();
    console.log('\n✅ Proceso completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();