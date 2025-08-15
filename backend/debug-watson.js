import dotenv from "dotenv";
dotenv.config();

import watsonController from "./src/controllers/watsonController.js";

async function testWatsonDirect() {
  try {
    console.log('🧪 Prueba directa Watson...');
    
    const result = await watsonController.callTriageManchester(
      "dolor de pecho, dificultad para respirar",
      "Dolor intenso desde hace 2 horas. Temperatura 38.5°C. Antecedentes: hipertensión",
      ""
    );
    
    console.log('📤 LO QUE ENVIAMOS:');
    console.log('sintoma_principal:', "dolor de pecho, dificultad para respirar");
    console.log('detalles_sintomas:', "Dolor intenso desde hace 2 horas. Temperatura 38.5°C. Antecedentes: hipertensión");
    
    console.log('\n📥 LO QUE RECIBIMOS:');
    console.log('Texto generado:', result.clasificacion_completa);
    console.log('Clasificación:', result.clasificacion_estandar);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testWatsonDirect();