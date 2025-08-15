import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
  User,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { syncUserData } from '../../services/api.js';
// ✅ IMPORTAR TU API REAL
import { 
  getAllPatients as apiGetAllPatients,
  createPatient as apiCreatePatient,
  updatePatient as apiUpdatePatient,
  deletePatient as apiDeletePatient,
  searchPatients as apiSearchPatients,
  checkUserIdExists as apiCheckUserIdExists,
  updatePatientPassword as apiUpdatePatientPassword
} from '../../services/api.js'; // Ajusta la ruta según tu estructura

// ✅ DEPARTAMENTOS DE BOLIVIA PARA EL SUFIJO DEL CI
const departamentos = [
  { code: 'LP', name: 'La Paz' },
  { code: 'CBBA', name: 'Cochabamba' },
  { code: 'SCZ', name: 'Santa Cruz' },
  { code: 'CH', name: 'Chuquisaca' },
  { code: 'OR', name: 'Oruro' },
  { code: 'PT', name: 'Potosí' },
  { code: 'TJ', name: 'Tarija' },
  { code: 'BE', name: 'Beni' },
  { code: 'PA', name: 'Pando' }
];

// ✅ WRAPPER FUNCTIONS PARA COMPATIBILIDAD
const getAllPatients = async (params) => {
  try {
    console.log('🔄 Cargando pacientes con params:', params);
    const response = await apiGetAllPatients(params);
    console.log('✅ Respuesta getAllPatients:', response.data);
    
    return {
      data: {
        patients: response.data.patients || [],
        pagination: response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalPatients: 0,
          hasNext: false,
          hasPrev: false,
          limit: 10
        }
      }
    };
  } catch (error) {
    console.error('❌ Error en getAllPatients:', error);
    throw error;
  }
};

const deletePatient = async (id) => {
  try {
    console.log('🗑️ Eliminando paciente:', id);
    const response = await apiDeletePatient(id);
    console.log('✅ Paciente eliminado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error eliminando paciente:', error);
    throw error;
  }
};

const createPatient = async (data) => {
  try {
    console.log('➕ Creando paciente:', data);
    // Construir el nombre completo antes de enviar
    const fullName = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno || ''}`.trim();
    const patientData = {
      ...data,
      name: fullName,
      ci: `${data.ciNumero}-${data.ciSufijo}` // Combinar CI con sufijo
    };
    // Eliminar campos temporales
    delete patientData.nombres;
    delete patientData.apellidoPaterno;
    delete patientData.apellidoMaterno;
    delete patientData.ciNumero;
    delete patientData.ciSufijo;
    
    const response = await apiCreatePatient(patientData);
    console.log('✅ Paciente creado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creando paciente:', error);
    throw error;
  }
};

const updatePatient = async (id, data) => {
  try {
    console.log('✏️ Actualizando paciente:', id, data);
    // Construir el nombre completo antes de enviar
    const fullName = `${data.nombres} ${data.apellidoPaterno} ${data.apellidoMaterno || ''}`.trim();
    const patientData = {
      ...data,
      name: fullName,
      ci: `${data.ciNumero}-${data.ciSufijo}` // Combinar CI con sufijo
    };
    // Eliminar campos temporales
    delete patientData.nombres;
    delete patientData.apellidoPaterno;
    delete patientData.apellidoMaterno;
    delete patientData.ciNumero;
    delete patientData.ciSufijo;
    
    const response = await apiUpdatePatient(id, patientData);
    console.log('✅ Paciente actualizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error actualizando paciente:', error);
    throw error;
  }
};

const searchPatients = async (searchTerm, filters) => {
  try {
    console.log('🔍 Buscando pacientes:', searchTerm, filters);
    const response = await apiSearchPatients(searchTerm, filters);
    console.log('✅ Resultados búsqueda:', response.data);
    
    return {
      data: {
        patients: response.data.patients || [],
        pagination: response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalPatients: 0,
          hasNext: false,
          hasPrev: false,
          limit: 10
        }
      }
    };
  } catch (error) {
    console.error('❌ Error en búsqueda:', error);
    throw error;
  }
};

const PatientList = () => {
  // Estados principales
  const { user, updateUserData } = useUser(); 
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  
  
  // Estados para modales
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  
  // Estados para formularios - ✅ CAMPOS DIVIDIDOS Y NUEVOS
  const [formData, setFormData] = useState({
    userId: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    email: '',
    ciNumero: '',
    ciSufijo: '',
    password: '',
    newPassword: '',
    dateOfBirth: '',
    gender: '',
    phone: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  
  const [validatingUserId, setValidatingUserId] = useState(false);
  // Estado para notificaciones
  const [notification, setNotification] = useState(null);

  // ✅ CARGAR PACIENTES AL MONTAR Y CUANDO CAMBIAN FILTROS
  useEffect(() => {
    loadPatients();
  }, [currentPage, statusFilter]);

  // ✅ BÚSQUEDA CON DEBOUNCE
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        status: statusFilter,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };
      
      const response = await getAllPatients(params);
      
      if (response && response.data) {
        setPatients(response.data.patients || []);
        setPagination(response.data.pagination || {});
      }
    } catch (error) {
      console.error('Error cargando pacientes:', error);
      showNotification('Error cargando pacientes', 'error');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      
      if (searchTerm.trim() === '' && statusFilter === '') {
        await loadPatients();
        return;
      }

      const response = await searchPatients(searchTerm, {
        status: statusFilter,
        page: 1,
        limit: 10
      });
      
      if (response && response.data) {
        setPatients(response.data.patients || []);
        setPagination(response.data.pagination || {});
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      showNotification('Error en la búsqueda', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleExportPatients = () => {
    try {
      if (patients.length === 0) {
        showNotification('No hay pacientes para exportar', 'error');
        return;
      }

      const csvHeaders = 'Código,Nombre,CI,Email,Teléfono,Edad,Género,Estado,Último Triaje\n';
      const csvData = patients.map(patient => {
        return [
          patient.userId || '',
          patient.name || '',
          patient.ci || '',
          patient.email || '',
          patient.phone || 'No registrado',
          patient.age || 'N/A',
          patient.gender || 'No especificado',
          patient.status === 'con_historial' ? 'Con Historial' : 'Registrado',
          patient.lastTriageDate ? formatDate(patient.lastTriageDate) : 'Nunca'
        ].map(field => `"${field}"`).join(',');
      }).join('\n');

      const csvContent = csvHeaders + csvData;
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pacientes_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showNotification('Lista de pacientes exportada exitosamente');
    } catch (error) {
      console.error('Error exportando pacientes:', error);
      showNotification('Error al exportar la lista', 'error');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      email: '',
      ciNumero: '',
      ciSufijo: '',
      password: '',
      newPassword: '',
      dateOfBirth: '',
      gender: '',
      phone: ''
    });
    setFormErrors({});
  };

  // ✅ VALIDACIONES MEJORADAS Y COMPLETAS
  const validateForm = () => {
    const errors = {};
    
    // Código de asegurado
    if (!formData.userId?.trim()) {
      errors.userId = 'Código requerido';
    }
    
    // Nombres
    if (!formData.nombres?.trim()) {
      errors.nombres = 'Nombres requeridos';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombres)) {
      errors.nombres = 'Solo se permiten letras y espacios';
    }
    
    // Apellido Paterno
    if (!formData.apellidoPaterno?.trim()) {
      errors.apellidoPaterno = 'Apellido paterno requerido';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.apellidoPaterno)) {
      errors.apellidoPaterno = 'Solo se permiten letras y espacios';
    }
    
    // Apellido Materno (opcional pero si se llena debe ser válido)
    if (formData.apellidoMaterno && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.apellidoMaterno)) {
      errors.apellidoMaterno = 'Solo se permiten letras y espacios';
    }
    
    // Email
    if (!formData.email?.trim()) {
      errors.email = 'Email requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    
    // CI Número
    if (!formData.ciNumero?.trim()) {
      errors.ciNumero = 'Número de CI requerido';
    } else if (!/^\d+$/.test(formData.ciNumero)) {
      errors.ciNumero = 'Solo se permiten números';
    }
    
    // CI Sufijo
    if (!formData.ciSufijo) {
      errors.ciSufijo = 'Seleccione el departamento';
    }
    
    // Teléfono
    if (formData.phone) {
      if (!/^\d+$/.test(formData.phone)) {
        errors.phone = 'Solo se permiten números';
      } else if (formData.phone.length < 8) {
        errors.phone = 'Mínimo 8 dígitos';
      }
    }
    
    // Fecha de nacimiento
    if (formData.dateOfBirth) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - 120); // Máximo 120 años
      
      if (birthDate > today) {
        errors.dateOfBirth = 'La fecha no puede ser futura';
      } else if (birthDate < minDate) {
        errors.dateOfBirth = 'Fecha no válida';
      }
    }
    
    // Contraseña (solo para crear)
    if (showCreateModal) {
      if (!formData.password?.trim()) {
        errors.password = 'Contraseña requerida';
      } else if (formData.password.length < 8) {
        errors.password = 'Mínimo 8 caracteres';
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        errors.password = 'Debe contener al menos una mayúscula';
      } else if (!/(?=.*\d)/.test(formData.password)) {
        errors.password = 'Debe contener al menos un número';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ VALIDACIÓN ASYNC PARA USERID ÚNICO
  const validateUserIdUnique = async (userId) => {
    if (!userId.trim() || showEditModal) return true; // Solo validar en crear
    
    try {
      setValidatingUserId(true);
      const response = await apiCheckUserIdExists(userId);
      return !response.data.exists;
    } catch (error) {
      console.error('Error verificando userId:', error);
      return false;
    } finally {
      setValidatingUserId(false);
    }
};

  // ✅ CREAR PACIENTE
// ✅ CREAR PACIENTE CON VALIDACIÓN UNIQUE
const handleCreatePatient = async () => {
  if (!validateForm()) return;
  
  // Validar userId único
  const isUserIdUnique = await validateUserIdUnique(formData.userId);
  if (!isUserIdUnique) {
    setFormErrors(prev => ({
      ...prev,
      userId: 'Este código de asegurado ya existe'
    }));
    return;
  }
  
  try {
    setLoading(true);
    const newPatient = {
      ...formData,
      role: 'asegurado'
    };
    
    await createPatient(newPatient);
    showNotification('Paciente creado exitosamente');
    setShowCreateModal(false);
    resetForm();
    await loadPatients();
  } catch (error) {
    console.error('Error creando paciente:', error);
    if (error.response?.data?.error?.includes('código de asegurado')) {
      setFormErrors(prev => ({
        ...prev,
        userId: 'Este código de asegurado ya existe'
      }));
    } else {
      showNotification('Error al crear paciente', 'error');
    }
  } finally {
    setLoading(false);
  }
};

  // ✅ EDITAR PACIENTE CON DETECCIÓN DE CAMBIOS
const handleEditPatient = async () => {
  if (!validateForm() || !selectedPatient) return;
  
  // Verificar si hay cambios
  if (!hasFormChanges()) {
    showNotification('No se detectaron cambios para actualizar', 'error');
    return;
  }
  
  try {
    setLoading(true);
    const updateData = { ...formData };
    delete updateData.password; // No actualizar contraseña
    delete updateData.newPassword; // No incluir nueva contraseña
    
    await updatePatient(selectedPatient.userId, updateData);
    showNotification('Paciente actualizado exitosamente');

       // ✅ AGREGAR ESTA SECCIÓN NUEVA
    // Si el paciente actualizado es el usuario actual, sincronizar contexto
    if (selectedPatient.userId === user?.userId) {
      try {
        console.log('🔄 Sincronizando datos del usuario actual...');
        const syncResponse = await syncUserData(selectedPatient.userId);
        updateUserData(syncResponse.data);
        console.log('✅ Contexto de usuario sincronizado');
      } catch (error) {
        console.error('❌ Error sincronizando contexto:', error);
      }
    }
    setShowEditModal(false);
    resetForm();
    setSelectedPatient(null);
    await loadPatients();
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    if (error.response?.data?.error?.includes('Email ya está en uso')) {
      setFormErrors(prev => ({
        ...prev,
        email: 'Este email ya está en uso por otro usuario'
      }));
    } else {
      showNotification('Error al actualizar paciente', 'error');
    }
  } finally {
    setLoading(false);
  }
};

  // ✅ CAMBIAR CONTRASEÑA DEL PACIENTE
const handleChangePassword = async () => {
  if (!formData.newPassword?.trim()) {
    setFormErrors(prev => ({ ...prev, newPassword: 'Nueva contraseña requerida' }));
    return;
  }
  
  if (formData.newPassword.length < 8) {
    setFormErrors(prev => ({ ...prev, newPassword: 'Mínimo 8 caracteres' }));
    return;
  }
  
  if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
    setFormErrors(prev => ({ ...prev, newPassword: 'Debe contener al menos una mayúscula' }));
    return;
  }
  
  if (!/(?=.*\d)/.test(formData.newPassword)) {
    setFormErrors(prev => ({ ...prev, newPassword: 'Debe contener al menos un número' }));
    return;
  }
  
  try {
    setLoading(true);
    await apiUpdatePatientPassword(selectedPatient.userId, formData.newPassword);
    showNotification('Contraseña actualizada exitosamente');
    setFormData(prev => ({ ...prev, newPassword: '' }));
    setFormErrors(prev => ({ ...prev, newPassword: '' }));
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    showNotification(
      error.response?.data?.error || 'Error al cambiar contraseña', 
      'error'
    );
  } finally {
    setLoading(false);
  }
};

  // ✅ ELIMINAR PACIENTE
  const handleDeletePatient = async (patientId, patientName) => {
    if (!window.confirm(`¿Estás seguro de eliminar al paciente ${patientName}?`)) return;
    
    try {
      setLoading(true);
      await deletePatient(patientId);
      showNotification('Paciente eliminado exitosamente');
      await loadPatients();
    } catch (error) {
      console.error('Error eliminando paciente:', error);
      showNotification('Error al eliminar paciente', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ✅ ABRIR MODAL DE EDICIÓN CON DATOS DIVIDIDOS
  const openEditModal = (patient) => {
    console.log('🔍 Datos completos del paciente:', patient); // Debug
    
    // Dividir el nombre completo y CI
    const nameParts = (patient.name || '').split(' ');
    const ciParts = (patient.ci || '').split('-');
    
    // ✅ BUSCAR FECHA EN MÚLTIPLES CAMPOS POSIBLES
    let formattedDate = '';
    
    // Buscar dateOfBirth primero
    if (patient.dateOfBirth && patient.dateOfBirth !== null) {
      console.log('📅 Campo dateOfBirth encontrado:', patient.dateOfBirth);
      
      try {
        // Procesar la fecha
        if (typeof patient.dateOfBirth === 'string') {
          if (patient.dateOfBirth.includes('T')) {
            formattedDate = patient.dateOfBirth.split('T')[0];
          } else if (patient.dateOfBirth.includes('-')) {
            formattedDate = patient.dateOfBirth;
          }
        } else if (patient.dateOfBirth instanceof Date || typeof patient.dateOfBirth === 'object') {
          // Si es un objeto Date de MongoDB
          const date = new Date(patient.dateOfBirth);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            formattedDate = `${year}-${month}-${day}`;
          }
        }
        
        console.log('📅 Fecha formateada exitosamente:', formattedDate);
        
      } catch (error) {
        console.error('❌ Error al formatear fecha:', error);
        formattedDate = '';
      }
    } else {
      // Si no hay dateOfBirth pero hay age, calcular fecha aproximada
      if (patient.age && patient.age > 0) {
        console.log(`⚠️ No hay dateOfBirth, pero la edad es ${patient.age}. Calculando fecha aproximada...`);
        
        // Calcular fecha aproximada (1 de enero del año correspondiente)
        const currentYear = new Date().getFullYear();
        const approximateBirthYear = currentYear - patient.age;
        formattedDate = `${approximateBirthYear}-01-01`;
        
        console.log('📅 Fecha aproximada calculada:', formattedDate);
      } else {
        console.log('⚠️ No se encontró fecha de nacimiento ni edad válida');
        console.log('📝 Campos disponibles:', Object.keys(patient));
      }
    }
    
    const newFormData = {
      userId: patient.userId || '',
      nombres: nameParts[0] || '',
      apellidoPaterno: nameParts[1] || '',
      apellidoMaterno: nameParts.slice(2).join(' ') || '',
      email: patient.email || '',
      ciNumero: ciParts[0] || '',
      ciSufijo: ciParts[1] || '',
      password: '',
      newPassword: '',
      dateOfBirth: formattedDate,
      gender: patient.gender === 'No especificado' ? '' : (patient.gender || ''),
      phone: patient.phone || ''
    };
    
    console.log('📝 FormData final - dateOfBirth:', newFormData.dateOfBirth);
    
    setSelectedPatient(patient);
    setFormData(newFormData);
    setFormErrors({});
    setShowEditModal(true);
  };


 // ✅ DETECTAR SI HUBO CAMBIOS EN EL FORMULARIO (LÓGICA UNIFICADA)
const hasFormChanges = () => {
  if (!selectedPatient) {
    console.log('❌ No hay selectedPatient');
    return false;
  }
  
  // Dividir datos actuales del paciente
  const nameParts = (selectedPatient.name || '').split(' ');
  const ciParts = (selectedPatient.ci || '').split('-');
  
  // ✅ USAR LA MISMA LÓGICA QUE openEditModal PARA LA FECHA
  let currentFormattedDate = '';
  
  if (selectedPatient.dateOfBirth && selectedPatient.dateOfBirth !== null) {
    try {
      // Procesar la fecha IGUAL que en openEditModal
      if (typeof selectedPatient.dateOfBirth === 'string') {
        if (selectedPatient.dateOfBirth.includes('T')) {
          currentFormattedDate = selectedPatient.dateOfBirth.split('T')[0];
        } else if (selectedPatient.dateOfBirth.includes('-')) {
          currentFormattedDate = selectedPatient.dateOfBirth;
        }
      } else if (selectedPatient.dateOfBirth instanceof Date || typeof selectedPatient.dateOfBirth === 'object') {
        // Si es un objeto Date de MongoDB
        const date = new Date(selectedPatient.dateOfBirth);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          currentFormattedDate = `${year}-${month}-${day}`;
        }
      }
    } catch (error) {
      currentFormattedDate = '';
    }
  } else {
    // Si no hay dateOfBirth pero hay age, calcular fecha aproximada IGUAL que openEditModal
    if (selectedPatient.age && selectedPatient.age > 0) {
      const currentYear = new Date().getFullYear();
      const approximateBirthYear = currentYear - selectedPatient.age;
      currentFormattedDate = `${approximateBirthYear}-01-01`;
    } else {
      currentFormattedDate = '';
    }
  }
  
  // Comparar cada campo con la MISMA lógica que openEditModal
  const currentData = {
    nombres: nameParts[0] || '',
    apellidoPaterno: nameParts[1] || '',
    apellidoMaterno: nameParts.slice(2).join(' ') || '',
    email: selectedPatient.email || '',
    ciNumero: ciParts[0] || '',
    ciSufijo: ciParts[1] || '',
    dateOfBirth: currentFormattedDate,
    gender: selectedPatient.gender || '',
    phone: selectedPatient.phone || ''
  };
  
  console.log('🔍 Comparando datos:');
  console.log('📊 Datos originales:', currentData);
  console.log('📊 Datos formulario:', {
    nombres: formData.nombres,
    apellidoPaterno: formData.apellidoPaterno,
    apellidoMaterno: formData.apellidoMaterno,
    email: formData.email,
    ciNumero: formData.ciNumero,
    ciSufijo: formData.ciSufijo,
    dateOfBirth: formData.dateOfBirth,
    gender: formData.gender,
    phone: formData.phone
  });
  
  // Verificar si algún campo cambió
  const hasChanges = (
    formData.nombres !== currentData.nombres ||
    formData.apellidoPaterno !== currentData.apellidoPaterno ||
    formData.apellidoMaterno !== currentData.apellidoMaterno ||
    formData.email !== currentData.email ||
    formData.ciNumero !== currentData.ciNumero ||
    formData.ciSufijo !== currentData.ciSufijo ||
    formData.dateOfBirth !== currentData.dateOfBirth ||
    formData.gender !== currentData.gender ||
    formData.phone !== currentData.phone
  );
  
  console.log('🔄 ¿Hay cambios?', hasChanges);
  return hasChanges;
};

  const openDetailModal = (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      'registrado': 'bg-gray-100 text-gray-700 border-gray-200',
      'con_historial': 'bg-green-100 text-green-700 border-green-200'
    };
    
    const labels = {
      'registrado': 'Registrado',
      'con_historial': 'Con Historial'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.registrado}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No registrado';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const today = new Date();
      const birth = new Date(dateOfBirth);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Users className="text-teal-600" size={32} />
                Gestión de Pacientes
              </h1>
              <p className="text-slate-600 mt-1">Administra todos los pacientes registrados en el sistema</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                onClick={handleExportPatients}
                disabled={loading}
              >
                <Download size={16} />
                Exportar
              </button>
              
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                disabled={loading}
              >
                <Plus size={16} />
                Nuevo Paciente
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre, CI, email o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none bg-white min-w-[180px]"
                disabled={loading}
              >
                <option value="">Todos los estados</option>
                <option value="registrado">Registrado</option>
                <option value="con_historial">Con Historial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}>
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? <AlertCircle size={20} /> : <Check size={20} />}
              {notification.message}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando pacientes...</p>
            </div>
          ) : patients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">
                {searchTerm || statusFilter ? 'No se encontraron pacientes con los filtros aplicados' : 'No se encontraron pacientes'}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-slate-50 border-b border-slate-200 p-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-slate-600">
                  <div className="col-span-3">Paciente</div>
                  <div className="col-span-2">Contacto</div>
                  <div className="col-span-2">Edad</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-2">Último Triaje</div>
                  <div className="col-span-1">Acciones</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-slate-200">
                {patients.map((patient) => (
                  <div key={patient._id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Patient Info */}
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {patient.name?.charAt(0)?.toUpperCase() || 'P'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{patient.name || 'Sin nombre'}</p>
                            <p className="text-sm text-slate-500">CI: {patient.ci || 'Sin CI'}</p>
                            <p className="text-xs text-slate-400">#{patient.userId || 'Sin código'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact */}
                      <div className="col-span-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} />
                            <span className="truncate">{patient.email || 'Sin email'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone size={14} />
                            <span>{patient.phone || 'No registrado'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Age */}
                      <div className="col-span-2">
                        <div className="text-sm">
                          <p className="font-medium text-slate-800">
                            {patient.age ? `${patient.age} años` : 'N/A'}
                          </p>
                            <p className="text-slate-500 capitalize">{patient.gender || 'No especificado'}</p>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        {getStatusBadge(patient.status)}
                      </div>

                      {/* Last Triage */}
                      <div className="col-span-2">
                        <div className="text-sm text-slate-600">
                          {patient.lastTriageDate ? formatDate(patient.lastTriageDate) : 'Nunca'}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openDetailModal(patient)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                            title="Ver detalles"
                            disabled={loading}
                          >
                            <Eye size={16} />
                          </button>
                          
                          <button
                            onClick={() => openEditModal(patient)}
                            className="p-2 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors"
                            title="Editar"
                            disabled={loading}
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDeletePatient(patient.userId, patient.name)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Eliminar"
                            disabled={loading}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-slate-50 border-t border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Mostrando {((currentPage - 1) * (pagination.limit || 10)) + 1} - {Math.min(currentPage * (pagination.limit || 10), pagination.totalPatients || 0)} de {pagination.totalPatients || 0} pacientes
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!pagination.hasPrev || loading}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span className="px-4 py-2 text-sm font-medium">
                    Página {currentPage} de {pagination.totalPages || 1}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!pagination.hasNext || loading}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ MODAL DE CREAR - CON VALIDACIONES COMPLETAS */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Nuevo Paciente</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Código de Asegurado */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código de Asegurado *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.userId}
                      onChange={async (e) => {
                        const value = e.target.value;
                        setFormData({...formData, userId: value});
                        
                        // Limpiar error anterior
                        if (formErrors.userId) {
                          setFormErrors(prev => ({...prev, userId: ''}));
                        }
                        
                        // Validar en tiempo real si hay valor
                        if (value.trim().length >= 3) {
                          setValidatingUserId(true);
                          try {
                            const response = await apiCheckUserIdExists(value);
                            if (response.data.exists) {
                              setFormErrors(prev => ({
                                ...prev, 
                                userId: 'Este código ya existe'
                              }));
                            }
                          } catch (error) {
                            console.error('Error validando userId:', error);
                          } finally {
                            setValidatingUserId(false);
                          }
                        }
                      }}
                      className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formErrors.userId ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="Ej: CNS001"
                      disabled={loading}
                    />
                    {validatingUserId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  {formErrors.userId && <p className="text-red-500 text-sm mt-1">{formErrors.userId}</p>}
                  {validatingUserId && <p className="text-blue-500 text-sm mt-1">Verificando disponibilidad...</p>}
                </div>

                {/* CI - División en número y sufijo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CI *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ciNumero}
                      onChange={(e) => {
                        // Solo permitir números
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, ciNumero: value});
                      }}
                      className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formErrors.ciNumero ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="12345678"
                      disabled={loading}
                    />
                    <select
                      value={formData.ciSufijo}
                      onChange={(e) => setFormData({...formData, ciSufijo: e.target.value})}
                      className={`w-20 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formErrors.ciSufijo ? 'border-red-500' : 'border-slate-200'
                      }`}
                      disabled={loading}
                    >
                      <option value="">--</option>
                      {departamentos.map(dept => (
                        <option key={dept.code} value={dept.code}>{dept.code}</option>
                      ))}
                    </select>
                  </div>
                  {(formErrors.ciNumero || formErrors.ciSufijo) && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.ciNumero || formErrors.ciSufijo}
                    </p>
                  )}
                </div>

                {/* Nombres */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.nombres ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="Juan Carlos"
                    disabled={loading}
                  />
                  {formErrors.nombres && <p className="text-red-500 text-sm mt-1">{formErrors.nombres}</p>}
                </div>

                {/* Apellido Paterno */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidoPaterno}
                    onChange={(e) => setFormData({...formData, apellidoPaterno: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.apellidoPaterno ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="Pérez"
                    disabled={loading}
                  />
                  {formErrors.apellidoPaterno && <p className="text-red-500 text-sm mt-1">{formErrors.apellidoPaterno}</p>}
                </div>

                {/* Apellido Materno */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    value={formData.apellidoMaterno}
                    onChange={(e) => setFormData({...formData, apellidoMaterno: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.apellidoMaterno ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="González (opcional)"
                    disabled={loading}
                  />
                  {formErrors.apellidoMaterno && <p className="text-red-500 text-sm mt-1">{formErrors.apellidoMaterno}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.email ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="correo@ejemplo.com"
                    disabled={loading}
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      // Solo permitir números
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, phone: value});
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.phone ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="70123456"
                    disabled={loading}
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.dateOfBirth ? 'border-red-500' : 'border-slate-200'
                    }`}
                    max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                    disabled={loading}
                  />
                  {formErrors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{formErrors.dateOfBirth}</p>}
                </div>

                {/* Género */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Género
                  </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({...formData, gender: e.target.value})}
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      disabled={loading}
                    >
                      <option value="">Seleccionar...</option> {/* ✅ USAR STRING VACÍO */}
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                    </select>
                </div>

               

                {/* Contraseña */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.password ? 'border-red-500' : 'border-slate-200'
                    }`}
                    placeholder="Mínimo 8 caracteres, incluir mayúscula y número"
                    disabled={loading}
                  />
                  {formErrors.password && <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleCreatePatient}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Creando...' : 'Crear Paciente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE EDITAR - CON VALIDACIONES COMPLETAS */}
      {showEditModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Editar Paciente</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                    setSelectedPatient(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Código de Asegurado - NO EDITABLE */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Código de Asegurado (No editable)
                  </label>
                  <input
                    type="text"
                    value={formData.userId}
                    disabled
                    className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                  />
                </div>

                {/* CI - División en número y sufijo */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    CI *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.ciNumero}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, ciNumero: value});
                      }}
                      className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formErrors.ciNumero ? 'border-red-500' : 'border-slate-200'
                      }`}
                      disabled={loading}
                    />
                    <select
                      value={formData.ciSufijo}
                      onChange={(e) => setFormData({...formData, ciSufijo: e.target.value})}
                      className={`w-20 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formErrors.ciSufijo ? 'border-red-500' : 'border-slate-200'
                      }`}
                      disabled={loading}
                    >
                      <option value="">--</option>
                      {departamentos.map(dept => (
                        <option key={dept.code} value={dept.code}>{dept.code}</option>
                      ))}
                    </select>
                  </div>
                  {(formErrors.ciNumero || formErrors.ciSufijo) && (
                    <p className="text-red-500 text-sm mt-1">
                      {formErrors.ciNumero || formErrors.ciSufijo}
                    </p>
                  )}
                </div>

                {/* Nombres */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={formData.nombres}
                    onChange={(e) => setFormData({...formData, nombres: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.nombres ? 'border-red-500' : 'border-slate-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.nombres && <p className="text-red-500 text-sm mt-1">{formErrors.nombres}</p>}
                </div>

                {/* Apellido Paterno */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apellido Paterno *
                  </label>
                  <input
                    type="text"
                    value={formData.apellidoPaterno}
                    onChange={(e) => setFormData({...formData, apellidoPaterno: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.apellidoPaterno ? 'border-red-500' : 'border-slate-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.apellidoPaterno && <p className="text-red-500 text-sm mt-1">{formErrors.apellidoPaterno}</p>}
                </div>

                {/* Apellido Materno */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Apellido Materno
                  </label>
                  <input
                    type="text"
                    value={formData.apellidoMaterno}
                    onChange={(e) => setFormData({...formData, apellidoMaterno: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.apellidoMaterno ? 'border-red-500' : 'border-slate-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.apellidoMaterno && <p className="text-red-500 text-sm mt-1">{formErrors.apellidoMaterno}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.email ? 'border-red-500' : 'border-slate-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.email && <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, phone: value});
                    }}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.phone ? 'border-red-500' : 'border-slate-200'
                    }`}
                    disabled={loading}
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>}
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      formErrors.dateOfBirth ? 'border-red-500' : 'border-slate-200'
                    }`}
                    max={new Date().toISOString().split('T')[0]}
                    disabled={loading}
                  />
                  {formErrors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{formErrors.dateOfBirth}</p>}
                </div>

                {/* Género */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Género
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                  </select>
                </div>
              </div>

              {/* Nueva Contraseña */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nueva Contraseña (Opcional)
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                      className={`flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        formErrors.newPassword ? 'border-red-500' : 'border-slate-200'
                      }`}
                      placeholder="Dejar vacío para mantener actual"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={handleChangePassword}
                      className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors disabled:opacity-50"
                      disabled={loading || !formData.newPassword?.trim()}
                    >
                      Cambiar
                    </button>
                  </div>
                  {formErrors.newPassword && <p className="text-red-500 text-sm mt-1">{formErrors.newPassword}</p>}
                  <p className="text-xs text-slate-500 mt-1">
                    Mínimo 8 caracteres, incluir mayúscula y número
                  </p>
                </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                    setSelectedPatient(null);
                  }}
                  className="px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={loading}
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleEditPatient}
                  className={`px-6 py-3 rounded-lg transition-colors disabled:opacity-50 ${
                    hasFormChanges() 
                      ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={loading || !hasFormChanges()}
                >
                  {loading ? 'Actualizando...' : hasFormChanges() ? 'Actualizar Paciente' : 'Sin Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ MODAL DE DETALLE - MANTENIDO IGUAL */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Detalles del Paciente</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedPatient(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Información Básica</h3>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-600">Nombre Completo</label>
                    <p className="text-slate-800 font-medium">{selectedPatient.name || 'No especificado'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">CI</label>
                    <p className="text-slate-800">{selectedPatient.ci || 'No especificado'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Código de Asegurado</label>
                    <p className="text-slate-800 font-mono">{selectedPatient.userId || 'No especificado'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Email</label>
                    <p className="text-slate-800">{selectedPatient.email || 'No especificado'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Teléfono</label>
                    <p className="text-slate-800">{selectedPatient.phone || 'No registrado'}</p>
                  </div>
                </div>

                {/* Medical Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">Información Médica</h3>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-600">Edad</label>
                    <p className="text-slate-800">{selectedPatient.age ? `${selectedPatient.age} años` : 'No especificada'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Género</label>
                    <p className="text-slate-800 capitalize">{selectedPatient.gender || 'No especificado'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Estado en el Sistema</label>
                    <div className="mt-1">
                      {getStatusBadge(selectedPatient.status)}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Último Triaje</label>
                    <p className="text-slate-800">
                      {selectedPatient.lastTriageDate ? formatDate(selectedPatient.lastTriageDate) : 'Nunca ha usado el sistema'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-600">Fecha de Registro</label>
                    <p className="text-slate-800">{formatDate(selectedPatient.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedPatient);
                  }}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center gap-2"
                  disabled={loading}
                >
                  <Edit size={16} />
                  Editar Paciente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;