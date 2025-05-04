// src/components/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  ChevronRight,
  Upload,
  ChevronDown,
  LogOut,
  User
} from 'lucide-react';
import TaskEvidence from './TaskEvidence';
import StudentSchedule from './StudentSchedule';

const StudentDashboard = () => {
  const { userData, signOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all'); // all, pending, submitted, approved
  const [visibleCount, setVisibleCount] = useState(5); // Para paginación simple

  useEffect(() => {
    if (userData) {
      fetchTasks();
    }
  }, [userData]);

  const fetchTasks = async () => {
    if (!userData) return;
  
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          evidences (*)
        `)
        .eq('student_id', userData.id)
        .order('due_date', { ascending: true });
  
      if (error) throw error;
      setTasks(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSignOut = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return 'bg-green-600';
    if (progress >= 60) return 'bg-blue-600';
    if (progress >= 30) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const calculateProgress = () => {
    if (!userData) return 0;
    return (userData.current_hours / userData.hours_required) * 100;
  };

  const progress = Math.min(100, calculateProgress());
  const progressColor = getProgressColor(progress);

  // Filtrado de tareas por estado
  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    return task.status === taskFilter;
  });

  // Tareas a mostrar según paginación
  const visibleTasks = filteredTasks.slice(0, visibleCount);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200">
      {/* Header con menú de usuario */}
      <div className="bg-white shadow rounded-b-2xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-indigo-700 drop-shadow-sm">
            Panel del Estudiante
          </h1>
          <div className="flex items-center gap-4">
            {/* Botón de horario en header */}
            <button
              onClick={() => setShowSchedule(true)}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold shadow-md"
              title="Ver Horario"
            >
              <Calendar className="w-5 h-5 sm:mr-2" />
              <span className="hidden sm:inline">Horario</span>
            </button>
            {/* Menú de usuario */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="hidden md:inline-block font-medium">
                  {userData?.full_name}
                </span>
                <ChevronDown 
                  className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'transform rotate-180' : ''}`} 
                />
              </button>
              
              {isUserMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleSignOut}
                    disabled={logoutLoading}
                    className={`w-full flex items-center px-4 py-2 text-sm ${
                      logoutLoading ? 'text-gray-400' : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {logoutLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cerrando sesión...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar sesión
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto p-6">
        {selectedTask ? (
          <TaskEvidence 
            task={selectedTask} 
            onClose={() => {
              setSelectedTask(null);
              fetchTasks();
            }}
          />
        ) : showSchedule ? (
          <StudentSchedule 
            onClose={() => setShowSchedule(false)}
            studentId={userData.id}
          />
        ) : (
          <div className="space-y-6">
            {/* Progress Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Progreso de Horas</h2>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white bg-indigo-600">
                      Progreso
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold inline-block text-indigo-600">
                      {userData.current_hours} / {userData.hours_required} horas
                    </span>
                  </div>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${progress}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor}`}
                  ></div>
                </div>
              </div>
            </div>

            {/* Tasks List */}
            <div className="bg-white/90 rounded-2xl shadow-xl overflow-hidden">
              <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-50 to-white">
                <h2 className="text-xl font-bold text-indigo-800 mr-0 sm:mr-4 tracking-tight">Tareas Asignadas</h2>
                <select
                  className="border-2 border-indigo-200 rounded-lg px-3 py-2 text-sm sm:text-base w-full sm:w-auto focus:ring-2 focus:ring-indigo-400"
                  value={taskFilter}
                  onChange={e => setTaskFilter(e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="pending">Pendientes</option>
                  <option value="submitted">Enviadas</option>
                  <option value="approved">Aprobadas</option>
                </select>
              </div>
              <div className="divide-y divide-indigo-100">
                {visibleTasks.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No tienes tareas asignadas
                  </div>
                ) : (
                  visibleTasks.map(task => (
                    <div key={task.id} className="p-6 hover:bg-indigo-50 transition-colors flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-indigo-900 flex items-center gap-2">
                          <Clock className="w-6 h-6 text-indigo-400" />
                          {task.title}
                        </h3>
                        <p className="mt-1 text-base text-gray-700">
                          {task.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-indigo-700">
                          <div className="flex items-center">
                            <Clock className="w-5 h-5 mr-1 text-indigo-400" />
                            {task.required_hours} horas
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-5 h-5 mr-1 text-indigo-400" />
                            Entregar antes del {new Date(task.due_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center mt-4 md:mt-0">
                        {task.status === 'approved' ? (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-md animate-pulse">
                            <CheckCircle className="w-6 h-6 mr-2" />
                            Completada
                          </span>
                        ) : task.status === 'submitted' ? (
                          <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-semibold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 shadow-md">
                            <Clock className="w-6 h-6 mr-2" />
                            En revisión
                          </span>
                        ) : (
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="inline-flex items-center px-5 py-2 rounded-full text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all duration-150"
                          >
                            <Upload className="w-6 h-6 mr-2" />
                            Subir Evidencia
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Botón para ver más tareas */}
              {visibleCount < filteredTasks.length && (
                <div className="p-4 flex justify-center">
                  <button
                    onClick={() => setVisibleCount(visibleCount + 5)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm sm:text-base"
                  >
                    Ver más tareas
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;