import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RegisterSymptoms from "./components/RegisterSymptoms";
import RegisterUserForm from "./components/RegisterUserForm";
import LoginUserForm from "./components/LoginUserForm";
import SymptomHistory from "./components/SymptomHistory";
import HomeAs from "./pages/HomeAs";
import { useUser } from "./context/UserContext";

// 🔐 Solo permite acceder si hay sesión activa
const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  return user ? children : <Navigate to="/login" replace />;
};

// 🚫 Evita acceder si ya hay sesión (para login/registro)
const PublicOnlyRoute = ({ children }) => {
  const { user } = useUser();
  return user ? <Navigate to="/" replace /> : children;
};

// ✅ Función principal App
function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas SIN navbar (fuera de Layout) */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginUserForm />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterUserForm />
            </PublicOnlyRoute>
          }
        />

        {/* Rutas CON navbar (dentro de Layout) */}
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomeAs />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <SymptomHistory />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/registersymp"
                  element={
                    <ProtectedRoute>
                      <RegisterSymptoms />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;