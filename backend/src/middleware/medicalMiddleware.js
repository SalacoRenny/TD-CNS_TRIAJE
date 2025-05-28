// backend/src/middleware/medicalMiddleware.js
import User from '../models/User.js';

export default async (req, res, next) => {
  try {
    // Verificar que el usuario existe y es personal médico
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Usuario no encontrado' 
      });
    }

    if (user.userType !== 'personal_medico') {
      return res.status(403).json({ 
        success: false,
        message: 'Acceso denegado. Solo personal médico autorizado.' 
      });
    }

    // Agregar información del usuario a la request
    req.user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      userType: user.userType,
      medicalRole: user.medicalRole,
      specialty: user.specialty
    };

    next();
  } catch (error) {
    console.error('Error en medicalMiddleware:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error en la verificación de permisos',
      error: error.message 
    });
  }
};