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

  const progress = calculateProgress();
  const progressColor = getProgressColor(progress);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header con menú de usuario */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            Panel del Estudiante
          </h1>
          
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
                    style={{ width: `${Math.min(100, progress)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor}`}
                  ></div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => setShowSchedule(true)}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-6 h-6 text-indigo-600 mr-3" />
                    <span className="text-lg font-medium">Ver Horario</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            </div>

            {/* Tasks List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Tareas Asignadas</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {tasks.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No tienes tareas asignadas
                  </div>
                ) : (
                  tasks.map(task => (
                    <div key={task.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {task.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {task.description}
                          </p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {task.required_hours} horas
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Entregar antes del {new Date(task.due_date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {task.status === 'approved' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Completada
                            </span>
                          ) : task.status === 'submitted' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-4 h-4 mr-1" />
                              En revisión
                            </span>
                          ) : (
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Subir Evidencia
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;