import { createContext, useContext, useState, useEffect } from "react";

// ✅ EXPORT NAMED - Para que funcione la importación
export const UserContext = createContext();

// Hook para usar el contexto
export const useUser = () => useContext(UserContext);

// Proveedor de contexto
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("cnsUser");
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("🧠 Usuario cargado desde localStorage:", parsed);
      return parsed;
    }
    console.log("🧠 No se encontró usuario en localStorage");
    return null;
  });

  // ✅ FUNCIÓN LOGOUT 
  const logout = () => {
    console.log("🚪 Cerrando sesión...");
    setUser(null);
    // No necesitas localStorage.removeItem aquí, el useEffect lo maneja
  };

  // ✅ FUNCIÓN PARA ACTUALIZAR DATOS DEL USUARIO (CORREGIDA)
  const updateUserData = (newUserData) => {
    console.log('🔄 Actualizando datos del usuario:', newUserData);
    
    const updatedUser = {
      ...user,
      ...newUserData
    };
    
    setUser(updatedUser);
    // ❌ ELIMINAR ESTA LÍNEA - el useEffect se encarga de localStorage
    // localStorage.setItem("cnsUser", JSON.stringify(updatedUser));
    console.log('✅ Usuario actualizado en contexto');
  };

  // ✅ useEffect maneja TODA la sincronización con localStorage
  useEffect(() => {
    if (user) {
      console.log("💾 Guardando usuario en localStorage:", user);
      localStorage.setItem("cnsUser", JSON.stringify(user));
    } else {
      console.log("🧹 Limpiando usuario del localStorage");
      localStorage.removeItem("cnsUser");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser, logout, updateUserData }}>
      {children}
    </UserContext.Provider>
  );
};