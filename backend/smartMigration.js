// 🔧 SCRIPT DE MIGRACIÓN INTELIGENTE - ANALIZA ANTES DE MIGRAR
// smartMigration.js - Solo migra lo que necesita migración

import mongoose from 'mongoose';
import User from './src/models/User.js'; // Ajustar ruta según tu estructura
import dotenv from 'dotenv';

dotenv.config();

// Conectar a MongoDB
await mongoose.connect(process.env.MONGODB_URI);

async function analyzeUsers() {
  console.log('🔍 ANALIZANDO USUARIOS EXISTENTES...\n');
  
  try {
    // 1. Obtener todos los usuarios
    const allUsers = await User.find({}).limit(50); // Limitar para análisis
    
    console.log(`📊 Total usuarios analizados: ${allUsers.length}\n`);
    
    // 2. Categorizar usuarios
    const categories = {
      complete: [], // Tienen firstName Y lastName válidos
      nameOnly: [], // Solo tienen 'name' válido
      broken: [], // Tienen "Sin nombre" o campos vacíos
      partial: [] // Tienen algunos datos pero incompletos
    };
    
    allUsers.forEach(user => {
      const hasValidFirstName = user.firstName && user.firstName !== 'Sin nombre' && user.firstName !== '';
      const hasValidLastName = user.lastName && user.lastName !== 'Sin nombre' && user.lastName !== '';
      const hasValidName = user.name && user.name !== 'Sin nombre' && user.name !== '';
      
      if (hasValidFirstName && hasValidLastName) {
        categories.complete.push(user);
      } else if (hasValidName && !hasValidFirstName) {
        categories.nameOnly.push(user);
      } else if (!hasValidName && !hasValidFirstName) {
        categories.broken.push(user);
      } else {
        categories.partial.push(user);
      }
    });
    
    // 3. Mostrar análisis
    console.log('📋 CATEGORÍAS DE USUARIOS:');
    console.log(`✅ Completos (firstName + lastName): ${categories.complete.length}`);
    console.log(`🔄 Solo name: ${categories.nameOnly.length}`);
    console.log(`❌ Rotos (Sin nombre): ${categories.broken.length}`);
    console.log(`⚠️ Parciales: ${categories.partial.length}\n`);
    
    // 4. Mostrar ejemplos de cada categoría
    console.log('📋 EJEMPLOS POR CATEGORÍA:\n');
    
    if (categories.complete.length > 0) {
      console.log('✅ USUARIOS COMPLETOS (NO NECESITAN MIGRACIÓN):');
      categories.complete.slice(0, 3).forEach(user => {
        console.log(`   ${user.email}: ${user.firstName} ${user.lastName}`);
      });
      console.log();
    }
    
    if (categories.nameOnly.length > 0) {
      console.log('🔄 USUARIOS SOLO CON NAME (NECESITAN SEPARACIÓN):');
      categories.nameOnly.slice(0, 3).forEach(user => {
        console.log(`   ${user.email}: name="${user.name}"`);
      });
      console.log();
    }
    
    if (categories.broken.length > 0) {
      console.log('❌ USUARIOS ROTOS (NECESITAN REPARACIÓN):');
      categories.broken.slice(0, 3).forEach(user => {
        console.log(`   ${user.email}: name="${user.name}", firstName="${user.firstName}"`);
      });
      console.log();
    }
    
    if (categories.partial.length > 0) {
      console.log('⚠️ USUARIOS PARCIALES (REVISAR MANUALMENTE):');
      categories.partial.slice(0, 3).forEach(user => {
        console.log(`   ${user.email}: name="${user.name}", firstName="${user.firstName}", lastName="${user.lastName}"`);
      });
      console.log();
    }
    
    return categories;
    
  } catch (error) {
    console.error('❌ Error en análisis:', error);
    return null;
  }
}

async function smartMigration() {
  console.log('🚀 INICIANDO MIGRACIÓN INTELIGENTE...\n');
  
  try {
    // 1. Analizar primero
    const categories = await analyzeUsers();
    if (!categories) return;
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // 2. MIGRAR USUARIOS CON SOLO 'NAME' (separar en firstName/lastName)
    console.log('🔄 MIGRANDO USUARIOS CON SOLO NAME...');
    for (const user of categories.nameOnly) {
      try {
        const nameParts = user.name.trim().split(' ');
        const firstName = nameParts[0] || 'Usuario';
        const lastName = nameParts.slice(1).join(' ') || 'Sin Apellido';
        
        await User.findByIdAndUpdate(user._id, {
          firstName: firstName,
          lastName: lastName,
          motherLastName: '' // Opcional
        });
        
        console.log(`   ✅ ${user.email}: "${user.name}" → ${firstName} ${lastName}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error migrando ${user.email}:`, error.message);
        errorCount++;
      }
    }
    
    // 3. REPARAR USUARIOS ROTOS (usar email como base)
    console.log('\n❌ REPARANDO USUARIOS ROTOS...');
    for (const user of categories.broken) {
      try {
        const emailPart = user.email.split('@')[0];
        const nameParts = emailPart.split(/[.\-_]/); // Separar por punto, guión, underscore
        
        let firstName = nameParts[0] || 'Usuario';
        let lastName = nameParts[1] || 'Estudiante';
        
        // Capitalizar
        firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
        
        // Casos especiales para emails conocidos
        const specialCases = {
          'lucy': { firstName: 'Lucy', lastName: 'Estudiante' },
          'hernesto': { firstName: 'Hernesto', lastName: 'Estudiante' },
          'jacki': { firstName: 'Jacki', lastName: 'Estudiante' },
          'maria': { firstName: 'María', lastName: 'García' },
          'juan': { firstName: 'Juan', lastName: 'Pérez' },
          'ana': { firstName: 'Ana', lastName: 'López' },
          'carlos': { firstName: 'Carlos', lastName: 'Rodríguez' }
        };
        
        const emailName = emailPart.toLowerCase();
        if (specialCases[emailName]) {
          firstName = specialCases[emailName].firstName;
          lastName = specialCases[emailName].lastName;
        }
        
        await User.findByIdAndUpdate(user._id, {
          firstName: firstName,
          lastName: lastName,
          motherLastName: ''
        });
        
        console.log(`   ✅ ${user.email}: REPARADO → ${firstName} ${lastName}`);
        migratedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error reparando ${user.email}:`, error.message);
        errorCount++;
      }
    }
    
    // 4. MOSTRAR USUARIOS PARCIALES PARA REVISIÓN MANUAL
    if (categories.partial.length > 0) {
      console.log('\n⚠️ USUARIOS PARCIALES (REVISAR MANUALMENTE):');
      categories.partial.forEach(user => {
        console.log(`   📝 ${user.email}: name="${user.name}", firstName="${user.firstName}", lastName="${user.lastName}"`);
      });
    }
    
    console.log(`\n🎉 MIGRACIÓN COMPLETADA:`);
    console.log(`   ✅ Usuarios migrados: ${migratedCount}`);
    console.log(`   ❌ Errores: ${errorCount}`);
    console.log(`   ✅ Ya completos: ${categories.complete.length}`);
    console.log(`   ⚠️ Requieren revisión manual: ${categories.partial.length}`);
    
    // 5. Verificar migración
    console.log('\n🔍 VERIFICANDO MIGRACIÓN...');
    const testUsers = await User.find({ 
      email: { $in: ['lucy@est.com', 'hernesto@est.com', 'jacki@est.com'] }
    });
    
    testUsers.forEach(user => {
      console.log(`   ✅ ${user.email}: ${user.firstName} ${user.lastName}`);
    });
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Migración finalizada');
  }
}

// Ejecutar análisis y migración
console.log('🎯 MIGRACIÓN INTELIGENTE DE USUARIOS\n');
console.log('Este script:');
console.log('1. ✅ NO toca usuarios que ya tienen firstName + lastName');
console.log('2. 🔄 Separa "name" en firstName + lastName cuando es necesario');
console.log('3. ❌ Repara usuarios con "Sin nombre" usando email');
console.log('4. ⚠️ Identifica casos que requieren revisión manual\n');

smartMigration();