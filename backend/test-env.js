import dotenv from 'dotenv';
dotenv.config();

console.log('🔍 Verificando variables de entorno:');
console.log('API_KEY:', process.env.IBM_WATSON_API_KEY ? '✅ Configurado' : '❌ Faltante');
console.log('DEPLOYMENT_ID:', process.env.IBM_WATSON_DEPLOYMENT_ID ? '✅ Configurado' : '❌ Faltante');
console.log('PROJECT_ID:', process.env.IBM_WATSON_PROJECT_ID ? '✅ Configurado' : '❌ Faltante');
console.log('REGION:', process.env.IBM_WATSON_REGION ? '✅ Configurado' : '❌ Faltante');

console.log('\n📋 Valores (primeros 10 caracteres):');
console.log('API_KEY:', process.env.IBM_WATSON_API_KEY?.substring(0, 10) + '...' || 'NULO');
console.log('DEPLOYMENT_ID:', process.env.IBM_WATSON_DEPLOYMENT_ID?.substring(0, 10) + '...' || 'NULO');