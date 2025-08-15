import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { getSymptomHistoryByUser } from "../services/api";
import { useUser } from "../context/UserContext";
import { CalendarDays, Thermometer, User, Mail, Shield, TrendingUp, Activity, Clock } from "lucide-react";

const SymptomHistory = () => {
  const { user } = useUser();
  console.log("📘 Usuario actual desde contexto en SymptomHistory:", user);

  const [history, setHistory] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [stats, setStats] = useState({
    totalConsults: 0,
    thisMonth: 0,
    avgTemperature: 0,
    lastConsult: null,
    completionRate: 0
  });

  useEffect(() => {
    if (!user.id) return;

    const fetchData = async () => {
      try {
        const response = await getSymptomHistoryByUser(user.id);
        setHistory(response.data);

        // Calcular estadísticas reales
        const totalConsults = response.data.length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const thisMonthConsults = response.data.filter(item => {
          const itemDate = new Date(item.createdAt);
          return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
        }).length;

        // Calcular temperatura promedio
        const temperaturesWithValues = response.data.filter(item => item.temperature && item.temperature > 0);
        const avgTemp = temperaturesWithValues.length > 0 
          ? (temperaturesWithValues.reduce((sum, item) => sum + item.temperature, 0) / temperaturesWithValues.length).toFixed(1)
          : 0;

        // Última consulta
        const lastConsultDate = response.data.length > 0 
          ? response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
          : null;

        // Tasa de finalización (asumiendo que las consultas con notas están completas)
        const completedConsults = response.data.filter(item => item.notes && item.notes.trim() !== "").length;
        const completionRate = totalConsults > 0 ? Math.round((completedConsults / totalConsults) * 100) : 0;

        setStats({
          totalConsults,
          thisMonth: thisMonthConsults,
          avgTemperature: parseFloat(avgTemp),
          lastConsult: lastConsultDate,
          completionRate
        });

        // Agrupar para gráfico
        const grouped = response.data.reduce((acc, item) => {
          const date = new Date(item.createdAt).toLocaleDateString("es-BO", {
            day: "2-digit",
            month: "2-digit"
          });
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.entries(grouped)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => {
            const [dayA, monthA] = a.date.split('/').map(Number);
            const [dayB, monthB] = b.date.split('/').map(Number);
            return monthA - monthB || dayA - dayB;
          });

        setMonthlyData(chartData);
      } catch (error) {
        console.error("Error al cargar historial:", error);
      }
    };

    fetchData();
  }, [user]);

  // Calcular días desde última consulta
  const getDaysSinceLastConsult = () => {
    if (!stats.lastConsult) return "N/A";
    const days = Math.floor((new Date() - new Date(stats.lastConsult)) / (1000 * 60 * 60 * 24));
    return days === 0 ? "Hoy" : `${days} día${days > 1 ? 's' : ''}`;
  };

  const pieData = [
    { name: 'Completadas', value: stats.completionRate, color: '#8B5CF6' },
    { name: 'Pendientes', value: 100 - stats.completionRate, color: '#06B6D4' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6 font-sans">
      {/* Header with floating effect */}
      <div className="mb-8 animate-fade-in">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Dashboard Médico
              </h1>
              <p className="text-slate-600 mt-1">Bienvenido de vuelta, gestiona tu historial clínico</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-rose-400 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Consultas</p>
              <p className="text-3xl font-bold">{stats.totalConsults}</p>
            </div>
            <Activity className="w-8 h-8 text-purple-200" />
          </div>
          <div className="mt-4 flex items-center text-purple-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            Historial completo
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-sm">Este Mes</p>
              <p className="text-3xl font-bold">{stats.thisMonth}</p>
            </div>
            <CalendarDays className="w-8 h-8 text-cyan-200" />
          </div>
          <div className="mt-4 flex items-center text-cyan-100 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            Última: {getDaysSinceLastConsult()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Temp. Promedio</p>
              <p className="text-3xl font-bold">
                {stats.avgTemperature > 0 ? `${stats.avgTemperature}°C` : "N/A"}
              </p>
            </div>
            <Thermometer className="w-8 h-8 text-emerald-200" />
          </div>
          <div className="mt-4 flex items-center text-emerald-100 text-sm">
            {stats.avgTemperature > 0 && stats.avgTemperature < 37.5 ? "Normal" : stats.avgTemperature >= 37.5 ? "Elevada" : "Sin datos"}
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Progreso</p>
              <p className="text-3xl font-bold">{stats.completionRate}%</p>
            </div>
            <div className="w-16 h-16">
              <PieChart width={64} height={64}>
                <Pie
                  data={pieData}
                  cx={32}
                  cy={32}
                  innerRadius={20}
                  outerRadius={30}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        {/* Patient Info */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 transform hover:shadow-2xl transition-all duration-300">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4 shadow-lg">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">{user?.fullName || "N/D"}</h2>
              <p className="text-slate-600">Información del Paciente</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <User className="w-5 h-5 text-indigo-600 mr-3" />
              <div>
                <p className="text-sm text-slate-600">CI</p>
                <p className="font-semibold text-slate-800">{user?.ci || "N/D"}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <Mail className="w-5 h-5 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-semibold text-slate-800">{user?.email || "N/D"}</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-600 mr-3" />
              <div>
                <p className="text-sm text-slate-600">Rol</p>
                <p className="font-semibold text-slate-800">
                  {user?.role === "personal_medico" ? "Personal Médico" : "Asegurado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
              Consultas del Mes
            </h2>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"></div>
              <span>Tendencia</span>
            </div>
          </div>
          
          {monthlyData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.8} />
                      <stop offset="50%" stopColor="#06B6D4" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    allowDecimals={false} 
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} consultas registradas`, "Total"]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                      backdropFilter: 'blur(10px)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    fill="url(#colorGradient)"
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2, fill: '#fff' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-slate-500">
              <div className="text-center">
                <Activity className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                <p>No hay consultas registradas este mes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Medical Records */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent mb-6">
          Últimos Registros Clínicos
        </h2>
        
        <div className="space-y-4">
          {history.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500">Aún no hay registros clínicos</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-gradient-to-r from-white to-slate-50 rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <CalendarDays className="w-5 h-5 text-slate-600 mr-2" />
                      <span className="text-sm font-medium text-slate-600">
                        {new Date(item.createdAt).toLocaleString("es-BO")}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">Síntomas:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.symptoms.map((symptom, i) => (
                            <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              {symptom}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">Condiciones:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.baseConditions.length > 0 ? item.baseConditions.map((condition, i) => (
                            <span key={i} className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                              {condition}
                            </span>
                          )) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Ninguna
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-1">Notas:</p>
                        <p className="text-sm text-slate-600">
                          {item.notes || "Sin notas adicionales"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full text-white shadow-lg">
                      <div className="text-center">
                        <Thermometer className="w-6 h-6 mx-auto mb-1" />
                        <span className="text-xs font-bold">
                          {item.temperature ? `${item.temperature}°C` : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SymptomHistory;