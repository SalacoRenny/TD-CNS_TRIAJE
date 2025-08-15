// migrate-users-PREVIEW.js
// 🔍 VERSIÓN SEGURA - Solo muestra qué haría la migración, NO modifica nada

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

async function previewMigration() {
  try {
    console.log('🔍 PREVIEW DE MIGRACIÓN - NO SE MODIFICARÁ NADA');
    console.log('=' .repeat(60));
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar usuarios que necesitan migración
    const usersToMigrate = await User.find({
      $and: [
        { name: { $exists: true, $ne: null, $ne: "" } },
        { 
          $or: [
            { firstName: { $exists: false } },
            { firstName: null },
            { firstName: "" },
            { lastName: { $exists: false } },
            { lastName: null },
            { lastName: "" }
          ]
        }
      ]
    });

    // Todos los usuarios para verificar estado actual
    const allUsers = await User.find({});
    
    console.log('\n📊 ESTADO ACTUAL DE LA BASE DE DATOS:');
    console.log(`👥 Total usuarios: ${allUsers.length}`);
    console.log(`🔄 Usuarios que necesitan migración: ${usersToMigrate.length}`);
    console.log(`✅ Usuarios ya migrados: ${allUsers.length - usersToMigrate.length}`);

    if (usersToMigrate.length === 0) {
      console.log('\n🎉 ¡Todos los usuarios ya están migrados!');
      return;
    }

    console.log('\n🔍 PREVIEW DE CAMBIOS QUE SE HARÍAN:');
    console.log('=' .repeat(60));

    let previewCount = 0;
    for (const user of usersToMigrate) {
      previewCount++;
      
      // Simular la división del nombre (SIN GUARDAR)
      const nameParts = user.name.trim().split(' ').filter(part => part.length > 0);
      
      let firstName, lastName, motherLastName;
      
      if (nameParts.length === 1) {
        firstName = nameParts[0];
        lastName = "Sin Apellido";
        motherLastName = null;
      } else if (nameParts.length === 2) {
        firstName = nameParts[0];
        lastName = nameParts[1];
        motherLastName = null;
      } else if (nameParts.length === 3) {
        firstName = nameParts[0];
        lastName = nameParts[1];
        motherLastName = nameParts[2];
      } else {
        firstName = nameParts[0];
        lastName = nameParts[1];
        motherLastName = nameParts.slice(2).join(' ');
      }

      console.log(`\n${previewCount}. Usuario: ${user.userId}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 CI: ${user.ci}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   📅 Creado: ${user.createdAt?.toLocaleDateString()}`);
      console.log(`   🔄 CAMBIO PROPUESTO:`);
      console.log(`      Actual → name: "${user.name}"`);
      console.log(`      Nuevo → firstName: "${firstName}"`);
      console.log(`             lastName: "${lastName}"`);
      console.log(`             motherLastName: "${motherLastName || 'null'}"`);
      
      // Verificar si tiene datos relacionados
      console.log(`   🔗 DATOS RELACIONADOS:`);
      console.log(`      _id: ${user._id} (NO se modifica)`);
      console.log(`      userId: ${user.userId} (NO se modifica)`);
      console.log(`      Otros campos: INTACTOS`);

      // Mostrar solo los primeros 5 para no saturar
      if (previewCount >= 5 && usersToMigrate.length > 5) {
        console.log(`\n... y ${usersToMigrate.length - 5} usuarios más`);
        break;
      }
    }

    // Verificar relaciones existentes
    console.log('\n🔗 VERIFICANDO RELACIONES EXISTENTES:');
    
    // Importar SymptomRecord para verificar
    const SymptomRecord = mongoose.model('SymptomRecord') || 
      mongoose.model('SymptomRecord', new mongoose.Schema({}, { strict: false }));
    
    try {
      const symptomRecords = await SymptomRecord.countDocuments({
        userId: { $in: usersToMigrate.map(u => u.userId) }
      });
      console.log(`📋 SymptomRecords relacionados: ${symptomRecords}`);
    } catch (e) {
      console.log(`📋 SymptomRecords: No se pudo verificar (${e.message})`);
    }

    console.log('\n⚠️  GARANTÍAS DE SEGURIDAD:');
    console.log('✅ NO se modifican IDs (_id, userId)');
    console.log('✅ NO se eliminan campos existentes');
    console.log('✅ NO se modifican relaciones');
    console.log('✅ Solo se AGREGAN campos nuevos');
    console.log('✅ Campo "name" original se mantiene intacto');
    console.log('✅ Operación reversible (se pueden eliminar los campos nuevos)');

    console.log('\n🎯 PARA EJECUTAR LA MIGRACIÓN REAL:');
    console.log('1. Verifica que este preview se ve correcto');
    console.log('2. Haz backup de la DB (recomendado)');
    console.log('3. Ejecuta: node migrate-users-REAL.js');

  } catch (error) {
    console.error('❌ Error en preview:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar preview
if (import.meta.url === `file://${process.argv[1]}`) {
  previewMigration()
    .then(() => {
      console.log('\n🔍 Preview completado - Ningún dato fue modificado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error en preview:', error);
      process.exit(1);
    });
}

export default previewMigration;