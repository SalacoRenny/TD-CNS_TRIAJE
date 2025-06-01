// medicalMiddleware.js
import User from '../models/User.js';

export default async (req, res, next) => {
  try {
    console.log('🔍 Middleware ejecutándose');
    console.log('🔍 Headers recibidos:', req.headers['x-user-id'], req.headers['x-user-role']);
    
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      console.log('❌ No hay x-user-id');
      return res.status(401).json({ 
        success: false,
        message: 'No hay x-user-id header' 
      });
    }

    console.log('🔍 Buscando usuario:', userId);
    const user = await User.findOne({ userId: userId });
    console.log('🔍 Usuario encontrado:', user ? 'SÍ' : 'NO');
    
    if (!user) {
      console.log('❌ Usuario no existe en DB');
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    console.log('🔍 Role del usuario:', user.role);
    if (user.role !== 'personal_medico') {
      console.log('❌ Role incorrecto');
      return res.status(403).json({ 
        success: false,
        message: 'No es personal médico' 
      });
    }

    console.log('✅ Usuario autorizado');
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Error en middleware:', error);
    res.status(500).json({ error: error.message });
  }
};