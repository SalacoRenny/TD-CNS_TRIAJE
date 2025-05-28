// backend/checkenv2.js
import dotenv from 'dotenv';
import fs from 'fs';

console.log('📁 Verificando archivo .env...\n');

// Cargar variables
dotenv.config();

// Mostrar todas las variables que empiezan con MONGO
console.log('🔍 Variables relacionadas con MongoDB:');
Object.keys(process.env).forEach(key => {
  if (key.includes('MONGO')) {
    console.log(`  ${key}: ✅ Definido`);
  }
});

console.log('\n🔍 Todas las variables cargadas:');
console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '✅ Definido' : '❌ No definido');
console.log('  MONGO_URI:', process.env.MONGO_URI ? '✅ Definido' : '❌ No definido');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ Definido' : '❌ No definido');
console.log('  PORT:', process.env.PORT ? `✅ ${process.env.PORT}` : '❌ No definido');

if (!process.env.JWT_SECRET) {
  console.log('\n⚠️  JWT_SECRET no está definido. Agrégalo a tu .env:');
  console.log('  JWT_SECRET=cualquier_texto_secreto_aqui');
}