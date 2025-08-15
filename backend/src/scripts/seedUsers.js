// backend/src/scripts/seedUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno - ir 2 niveles arriba para llegar a backend/
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Verificar que las variables se cargaron
console.log('📁 Cargando .env desde:', path.resolve(__dirname, '../../.env'));
console.log('🔍 MONGODB_URI cargado:', !!process.env.MONGODB_URI);

// Crear readline para ES modules
const require = createRequire(import.meta.url);
const readline = require('readline');

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
    birthDate: new Date('1990-05-15'),
    phone: '70123456',
    address: 'Av. América #123'
  },
  {
    insuranceCode: '1002',
    fullName: 'María López Flores',
    email: 'maria.lopez@email.com',
    documentNumber: '2345678',
    password: 'paciente123',
    userType: 'asegurado',
    birthDate: new Date('1985-08-20'),
    phone: '70234567',
    address: 'Calle Bolivar #456'
  },
  {
    insuranceCode: '1003',
    fullName: 'Roberto Silva Vargas',
    email: 'roberto.silva@email.com',
    documentNumber: '3456789',
    password: 'paciente123',
    userType: 'asegurado',
    birthDate: new Date('1978-03-10'),
    phone: '70345678',
    address: 'Av. Ballivian #789'
  }
];

// Función auxiliar para hacer preguntas en consola
function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function seedUsers() {
  try {
    // Verificar que existe MONGODB_URI
    if (!process.env.MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI no está definido en las variables de entorno');
      console.log('Verifica que el archivo .env contiene MONGODB_URI=...');
      process.exit(1);
    }
    
    console.log('🔗 Conectando a MongoDB...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Preguntar si eliminar usuarios existentes
    const response = await askQuestion('\n¿Desea eliminar todos los usuarios existentes? (s/n): ');
    if (response.toLowerCase() === 's') {
      await User.deleteMany({});
      console.log('🗑️  Usuarios eliminados');
    }

    // Crear usuarios de prueba
    console.log('\n📝 Creando usuarios de prueba...\n');
    
    for (const userData of testUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({
          $or: [
            { email: userData.email },
            { insuranceCode: userData.insuranceCode },
            { documentNumber: userData.documentNumber }
          ]
        });

        if (existingUser) {
          console.log(`⚠️  Usuario ${userData.fullName} ya existe, saltando...`);
          continue;
        }

        // Crear nuevo usuario
        const user = new User(userData);
        await user.save();
        console.log(`✅ Usuario creado: ${userData.fullName} (${userData.userType})`);
      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.fullName}:`, error.message);
      }
    }

    console.log('\n📋 Resumen de usuarios para prueba:');
    console.log('\n🏥 PERSONAL MÉDICO:');
    console.log('  Email: carlos.mendoza@cns.bo | Password: medico123');
    console.log('  Email: ana.rodriguez@cns.bo | Password: medico123');
    console.log('\n👥 PACIENTES:');
    console.log('  Email: juan.perez@email.com | Password: paciente123');
    console.log('  Email: maria.lopez@email.com | Password: paciente123');
    console.log('  Email: roberto.silva@email.com | Password: paciente123');

    console.log('\n✅ Proceso completado exitosamente');
    
    // Cerrar conexión
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Ejecutar el script
seedUsers();