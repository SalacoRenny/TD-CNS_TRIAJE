// backend/fixIndex.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Listar índices actuales
    console.log('\n📋 Índices actuales:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, index.key);
    });
    
    // Eliminar el índice problemático si existe
    try {
      await collection.dropIndex('userId_1');
      console.log('\n✅ Índice userId_1 eliminado');
    } catch (error) {
      console.log('\n⚠️  El índice userId_1 no existe o ya fue eliminado');
    }
    
    console.log('\n✅ Proceso completado');
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixIndexes();