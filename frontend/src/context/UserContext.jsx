import { createContext, useContext, useState, useEffect } from "react";

const UserContext = createContext();

// Hook para usar el contexto
export const useUser = () => useContext(UserContext);

// Proveedor de contexto
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("cnsUser");
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("🧠 Usuario cargado desde localStorage:", parsed); // 👈 LOG 1
      return parsed;
    }
    console.log("🧠 No se encontró usuario en localStorage"); // 👈 LOG 2
    return null;
  });

  useEffect(() => {
    if (user) {
      console.log("💾 Guardando usuario en localStorage:", user); // 👈 LOG 3
      localStorage.setItem("cnsUser", JSON.stringify(user));
    } else {
      console.log("🧹 Limpiando usuario del localStorage"); // 👈 LOG 4
      localStorage.removeItem("cnsUser");
    }
  }, [user]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};
