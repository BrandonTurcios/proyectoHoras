// src/components/Statistics.jsx
import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Calendar, Users, Clock, CheckCircle, Filter } from 'lucide-react';

const Statistics = ({ students, tasks }) => {
  const [timeFrame, setTimeFrame] = useState('trimester'); // trimester, semester, year
  const [selectedArea, setSelectedArea] = useState('all');

  // Colores para los gráficos
  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  // Calcular el inicio del período actual
  const getCurrentPeriodStart = () => {
    const now = new Date();
    switch (timeFrame) {
      case 'trimester':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      case 'semester':
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 6) * 6, 1);
      case 'year':
        return new Date(now.getFullYear(), 0, 1);
      default:
        return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    }
  };

  // Estadísticas calculadas
  const statistics = useMemo(() => {
    const periodStart = getCurrentPeriodStart();
    const filteredStudents = selectedArea === 'all' 
      ? students 
      : students.filter(s => s.internship_area === selectedArea);

    const filteredTasks = tasks.filter(t => new Date(t.created_at) >= periodStart);

    // Progreso promedio de horas
    const averageProgress = filteredStudents.reduce((acc, student) => {
      return acc + (student.current_hours / student.hours_required) * 100;
    }, 0) / (filteredStudents.length || 1);

    // Distribución de estados de tareas
    const taskStatusDistribution = {
      pending: filteredTasks.filter(t => t.status === 'pending').length,
      submitted: filteredTasks.filter(t => t.status === 'submitted').length,
      approved: filteredTasks.filter(t => t.status === 'approved').length
    };

    // Datos para el gráfico de barras de progreso individual
    const studentProgress = filteredStudents.map(student => ({
      name: student.full_name,
      completed: student.current_hours,
      required: student.hours_required,
      progress: (student.current_hours / student.hours_required) * 100
    }));

    // Estudiantes por nivel de progreso
    const progressCategories = {
      low: filteredStudents.filter(s => (s.current_hours / s.hours_required) < 0.33).length,
      medium: filteredStudents.filter(s => (s.current_hours / s.hours_required) >= 0.33 && (s.current_hours / s.hours_required) < 0.66).length,
      high: filteredStudents.filter(s => (s.current_hours / s.hours_required) >= 0.66 && (s.current_hours / s.hours_required) < 1).length,
      completed: filteredStudents.filter(s => (s.current_hours / s.hours_required) >= 1).length
    };

    return {
      averageProgress,
      taskStatusDistribution,
      studentProgress,
      progressCategories
    };
  }, [students, tasks, timeFrame, selectedArea]);

  // Datos para el gráfico circular de categorías de progreso
  const progressCategoriesData = [
    { name: 'Bajo (0-33%)', value: statistics.progressCategories.low },
    { name: 'Medio (33-66%)', value: statistics.progressCategories.medium },
    { name: 'Alto (66-99%)', value: statistics.progressCategories.high },
    { name: 'Completado (100%)', value: statistics.progressCategories.completed }
  ];

  if (!students || students.length === 0 || !tasks || tasks.length === 0) {
    return (
      <div className="text-gray-500">No hay datos suficientes para mostrar estadísticas.</div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filtros */}
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-4 sm:p-8">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Período
            </label>
            <select
              className="border-2 border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
            >
              <option value="trimester">Trimestre</option>
              <option value="semester">Semestre</option>
              <option value="year">Año</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Área
            </label>
            <select
              className="border-2 border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
            >
              <option value="all">Todas las áreas</option>
              {Array.from(new Set(students.map(s => s.internship_area))).map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-6 flex items-center">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Estudiantes Activos</h3>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {students.length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-6 flex items-center">
          <div className="flex items-center">
            <Clock className="w-10 h-10 text-green-600 dark:text-green-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Promedio de Progreso</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round(statistics.averageProgress)}%
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-6 flex items-center">
          <div className="flex items-center">
            <CheckCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tareas Completadas</h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statistics.taskStatusDistribution.approved}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-6 flex items-center">
          <div className="flex items-center">
            <Calendar className="w-10 h-10 text-yellow-600 dark:text-yellow-400" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tareas Pendientes</h3>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {statistics.taskStatusDistribution.pending}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras de progreso individual */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-4">Progreso Individual</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statistics.studentProgress}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
                <Bar dataKey="completed" name="Horas Completadas" fill="#4F46E5" />
                <Bar dataKey="required" name="Horas Requeridas" fill="#E5E7EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico circular de categorías de progreso */}
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-6">
          <h3 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-4">Distribución de Progreso</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={progressCategoriesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {progressCategoriesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.8)',
                    border: 'none',
                    borderRadius: '0.5rem',
                    color: '#F3F4F6'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla detallada */}
      <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Estudiante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Horas Completadas
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Progreso
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {statistics.studentProgress.map((student, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{student.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {students.find(s => s.full_name === student.name)?.internship_area}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {student.completed} / {student.required}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full"
                      style={{ width: `${Math.min(100, student.progress)}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round(student.progress)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Statistics;