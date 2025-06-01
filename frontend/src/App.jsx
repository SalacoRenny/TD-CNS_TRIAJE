import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import RegisterSymptoms from "./components/RegisterSymptoms";
import RegisterUserForm from "./components/RegisterUserForm";
import LoginUserForm from "./components/LoginUserForm";
import SymptomHistory from "./components/SymptomHistory";
import HomeAs from "./pages/HomeAs";
import HomeMedical from "./pages/HomeMedical";
import { useUser } from "./context/UserContext";

// 🔐 Solo permite acceder si hay sesión activa
const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  return user ? children : <Navigate to="/login" replace />;
};

// ✨ Solo para personal médico
const MedicalRoute = ({ children }) => {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'personal_medico') {
    return <Navigate to="/" replace />;
  }

  return children;
};

// 🚫 Evita acceder si ya hay sesión
const PublicOnlyRoute = ({ children }) => {
  const { user } = useUser();
  return user ? <Navigate to="/" replace /> : children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas (sin Layout) */}
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

        {/* Dashboard médico (sin Layout) */}
        <Route
          path="/medical-dashboard"
          element={
            <MedicalRoute>
              <HomeMedical />
            </MedicalRoute>
          }
        />

        {/* Rutas con Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <HomeAs />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout>
                <SymptomHistory />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/registersymp"
          element={
            <ProtectedRoute>
              <Layout>
                <RegisterSymptoms />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;


//funcional, ver la parte de la pestaña de pacientes.
