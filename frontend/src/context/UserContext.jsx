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

  // ✅ AGREGAR FUNCIÓN LOGOUT que faltaba
  const logout = () => {
    console.log("🚪 Cerrando sesión...");
    setUser(null);
    localStorage.removeItem("cnsUser");
  };

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
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};