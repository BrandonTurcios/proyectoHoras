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
  User,
  ListChecks,
  BarChart2,
  ArrowLeftRight,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import TaskEvidence from './TaskEvidence';
import StudentSchedule from './StudentSchedule';
import AreaChangeRequestModal from './AreaChangeRequestModal';
import ThemeToggle from './ThemeToggle';

const SIDEBAR_ITEMS = [
  { key: 'tasks', label: 'Tareas', icon: <ListChecks className="w-5 h-5 mr-3" /> },
  { key: 'schedule', label: 'Horario', icon: <Calendar className="w-5 h-5 mr-3" /> },
  { key: 'area', label: 'Solicitar cambio de área', icon: <ArrowLeftRight className="w-5 h-5 mr-3" /> },
];

const StudentDashboard = () => {
  const { userData, signOut, refreshUserData } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState([]);
  const [showAreaRequestModal, setShowAreaRequestModal] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [taskFilter, setTaskFilter] = useState('all');
  const [visibleCount, setVisibleCount] = useState(5);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  
  const isTaskOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    return today > taskDueDate;
  };

  useEffect(() => {
    if (userData) {
      fetchTasks();
    }
    const fetchAreas = async () => {
      const { data, error } = await supabase.from('areas').select('*');
      if (!error && data) setAreas(data);
    };
    fetchAreas();
  }, [userData]);

  const fetchTasks = async () => {
    if (!userData) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, workspaces(name), evidences (*)`)
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
  const progressColor = getProgressColor(Math.min(100, progress));

  // Filtrado de tareas por estado
  const filteredTasks = tasks.filter(task => {
    if (taskFilter === 'all') return true;
    return task.status === taskFilter;
  });

  // Ordenar: pendientes, luego enviadas, luego completadas, por id ascendente
  const statusOrder = { pending: 0, submitted: 1, approved: 2 };
  const orderedTasks = [...filteredTasks].sort((a, b) => {
    const statusA = statusOrder[a.status] ?? 99;
    const statusB = statusOrder[b.status] ?? 99;
    if (statusA !== statusB) return statusA - statusB;
    return a.id - b.id;
  });

  const visibleTasks = orderedTasks.slice(0, visibleCount);

  // Sidebar area name
  
  // Sidebar area name
  const areaName = areas.find(a => a.id === userData?.internship_area)?.name || 'Sin área';

  // Responsive: close sidebar on resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main content rendering by tab
  let mainContent = null;
  if (loading) {
    mainContent = (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  } else if (selectedTask) {
    mainContent = (
      <TaskEvidence
        task={selectedTask}
        onClose={() => {
          setSelectedTask(null);
          fetchTasks();
        }}
      />
    );
  } else if (activeTab === 'schedule') {
    mainContent = (
      <StudentSchedule
        onClose={() => setActiveTab('tasks')}
        studentId={userData.id}
      />
    );
  } else if (activeTab === 'area') {
    mainContent = (
      <AreaChangeRequestModal
        currentAreaId={userData.internship_area}
        areas={areas}
        studentId={userData.id}
        onClose={() => setActiveTab('tasks')}
      />
    );
  } else {
    // Tareas
    mainContent = (
      <div className="space-y-6">
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 mb-2">
            <h2 className="text-xl font-bold text-indigo-800 dark:text-indigo-300 mr-0 sm:mr-4 tracking-tight">Tareas Asignadas</h2>
            <select
              className="border-2 border-indigo-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm sm:text-base w-full sm:w-auto focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={taskFilter}
              onChange={e => setTaskFilter(e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="submitted">Enviadas</option>
              <option value="approved">Aprobadas</option>
            </select>
          </div>
          <div className="divide-y divide-indigo-100 dark:divide-gray-700">
            {visibleTasks.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No tienes tareas asignadas
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleTasks.map(task => (
                  <div key={task.id} className="p-6 flex flex-col h-full bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl border border-indigo-100 dark:border-gray-700 transition-colors hover:bg-indigo-50 dark:hover:bg-gray-800">
                    <div className="flex-1 min-w-0 flex flex-col h-full gap-3">
                      <div className="mb-2">
                        <div className="relative group mb-1">
                          <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                            <span className="flex-shrink-0">
                              <ClipboardList className="w-6 h-6 text-indigo-400 dark:text-indigo-300" />
                            </span>
                            <span className="truncate min-w-0">{task.title}</span>
                          </h3>
                          {/* Tooltip for long titles */}
                          <div className="hidden group-hover:block absolute left-0 top-full z-50 mt-1 w-max max-w-xs bg-indigo-900 dark:bg-indigo-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg whitespace-pre-line break-words">
                            {task.title}
                          </div>
                        </div>
                        <div className="relative group">
                          <p className="mt-1 text-base text-gray-700 dark:text-gray-300 line-clamp-3">
                            {task.description}
                          </p>
                          {/* Tooltip for long descriptions */}
                          <div className="hidden group-hover:block absolute left-0 top-full z-50 mt-1 w-max max-w-xs bg-indigo-900 dark:bg-indigo-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg whitespace-pre-line break-words">
                            {task.description}
                          </div>
                        </div>
                        {task.workspaces && (
                          <div className="flex items-center mt-3 text-sm text-indigo-700 dark:text-indigo-400 gap-1">
                            <Briefcase className="w-4 h-4 text-indigo-400 dark:text-indigo-300" />
                            <span>Espacio: <span className="font-bold">{task.workspaces.name}</span></span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-indigo-700 dark:text-indigo-400 mb-2">
                        <div className="flex items-center gap-1">
                          <Clock className="w-5 h-5 text-indigo-400 dark:text-indigo-300" />
                          {task.required_hours} horas
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-5 h-5 text-indigo-400 dark:text-indigo-300" />
                          Entregar antes del {new Date(task.due_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      {task.status === 'approved' ? (
                        <span className="inline-flex items-center justify-center px-4 py-2 rounded-full text-base font-semibold bg-gradient-to-r from-green-400 to-green-600 text-white shadow-md animate-pulse">
                          <CheckCircle className="w-6 h-6 mr-2" />
                          Completada
                        </span>
                      ) : task.status === 'submitted' ? (
                        <span className="inline-flex items-center justify-center px-4 py-2 rounded-full text-base font-semibold bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 dark:text-yellow-100 shadow-md">
                          <Clock className="w-6 h-6 mr-2" />
                          En revisión
                        </span>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <button
                            onClick={() => setSelectedTask(task)}
                            className="inline-flex items-center justify-center px-5 py-2 rounded-full text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all duration-150 w-full sm:w-auto"
                          >
                            <Upload className="w-6 h-6 mr-2" />
                            Subir Evidencia
                          </button>
                          {isTaskOverdue(task.due_date) && task.status === 'pending' && (
                            <span className="inline-flex items-center justify-center px-4 py-2 rounded-full text-base font-semibold bg-gradient-to-r from-red-400 to-red-600 text-white shadow-md w-full sm:w-auto">
                              Atrasada
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
    );
  }

  // Progreso debajo del panel de estudiante en el sidebar
  const isCompleted = progress >= 100;
  const ProgressCard = (
    <div className="bg-white rounded-2xl shadow p-4 my-4 w-full flex flex-col items-center border border-indigo-100">
      <h2 className={`text-base font-semibold mb-2 text-center ${isCompleted ? 'text-green-700' : 'text-indigo-700'}`}>{isCompleted ? 'COMPLETADO' : 'Progreso de Horas'}</h2>
      <div className="w-full">
        <div className="flex mb-2 items-center justify-between">
          <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white ${isCompleted ? 'bg-green-600' : 'bg-indigo-600'}`}>
            {isCompleted ? 'COMPLETADO' : 'Progreso'}
          </span>
          <span className={`text-xs font-semibold inline-block ${isCompleted ? 'text-green-700' : 'text-indigo-600'}`}>
            {userData.current_hours} / {userData.hours_required} horas
          </span>
        </div>
        <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200">
          <div
            style={{ width: `${Math.min(100, progress)}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isCompleted ? 'bg-green-600' : progressColor}`}
          ></div>
        </div>
        <div className={`text-xs text-center ${isCompleted ? 'text-green-700' : 'text-gray-500'}`}
        >
          {isCompleted ? '¡Has completado tus horas!' : `${Math.round(progress)}% completado`}
        </div>
      </div>
    </div>
  );

  // Cuando se sube evidencia o se revisan tareas, refresco los datos del usuario
  const handleTaskEvidenceClose = () => {
    setSelectedTask(null);
    fetchTasks();
    if (typeof refreshUserData === 'function') {
      refreshUserData();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Botón del menú fuera del contenedor principal, solo visible cuando el sidebar está cerrado */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-[60] p-2 rounded bg-white dark:bg-gray-900 shadow-lg sm:hidden border border-indigo-100 dark:border-gray-800"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[55] sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed w-64 h-full bg-white/90 dark:bg-gray-900/95 shadow-2xl flex flex-col transition-all duration-300 z-[60] rounded-r-3xl border-r border-indigo-100 dark:border-gray-800 ${
        isSidebarOpen ? 'left-0' : '-left-64 sm:left-0'
      }`}>
        {/* Botón cerrar sidebar en móvil, cuadrado */}
        {isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-1/2 right-[-20px] transform -translate-y-1/2 z-50 bg-white/90 dark:bg-gray-900/95 border border-indigo-100 dark:border-gray-800 rounded p-2 shadow-lg sm:hidden"
            aria-label="Cerrar menú"
            type="button"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        <div className="p-2 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 drop-shadow-sm">Panel de Estudiante</h2>
          <p className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400">
      {(() => {
        const areaName = areas.find(a => a.id === userData?.internship_area)?.name;
        return areaName || userData?.internship_area || 'Sin área asignada';
      })()}
    </p>
        </div>
        
        <nav className="mt-4 sm:mt-6 flex-1 flex flex-col justify-between">
          <div className="space-y-2 sm:space-y-0">
            {SIDEBAR_ITEMS.map(item => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveTab(item.key);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                  activeTab === item.key ? 'bg-indigo-50 text-indigo-600' : ''
                }`}
              >
                <div className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3">
                  {item.icon}
                </div>
                <span className="text-lg sm:text-base">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Add ProgressCard here */}
        {userData && (
          <div className="px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-4 my-4 w-full flex flex-col items-center border border-indigo-100 dark:border-gray-700">
              <h2 className="text-base font-semibold mb-2 text-center text-indigo-700 dark:text-indigo-400">
                Progreso de Horas
              </h2>
              <div className="w-full">
                <div className="flex mb-2 items-center justify-between">
                  <span className={`text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-white ${isCompleted ? 'bg-green-600' : 'bg-indigo-600'}`}
                  >
                    {isCompleted ? 'COMPLETADO' : 'Progreso'}
                  </span>
                  <span className={`text-xs font-semibold inline-block ${isCompleted ? 'text-green-700 dark:text-green-400' : 'text-indigo-600 dark:text-indigo-400'}`}
                    style={{ marginLeft: '0.5rem', marginRight: '0' }}>
                    {userData.current_hours} / {userData.hours_required} horas
                  </span>
                </div>
                <div className="overflow-hidden h-2 mb-2 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                  <div
                    style={{ width: `${Math.min(100, progress)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${isCompleted ? 'bg-green-600' : progressColor}`}
                  ></div>
                </div>
                <div className={`text-xs text-center font-semibold ${isCompleted ? 'text-green-700 dark:text-green-400' : 'text-indigo-700 dark:text-indigo-400'}`}
                >
                  {`${Math.round(progress)}% completado`}
                </div>
                {isCompleted && (
                  <div className="text-xs text-center text-green-700 dark:text-green-400 mt-1 font-semibold">
                    ¡Has completado tus horas!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Menú de usuario y ThemeToggle al fondo */}
<div className="mt-auto p-2 sm:p-4 border-t border-indigo-100 dark:border-gray-800 flex flex-col gap-4">
  <div className="flex items-center gap-2">
    <ThemeToggle />
    <div className="relative flex-1 min-w-0"> {/* Cambiado a flex-1 y min-w-0 */}
      <button
        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors overflow-hidden" 
      >
        <div className="flex items-center min-w-0"> {/* Añadido min-w-0 */}
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
            <User className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-left ml-3 min-w-0"> {/* Añadido min-w-0 */}
            <p className="text-xs sm:text-sm font-medium truncate text-gray-900 dark:text-gray-100">
              {userData?.full_name || 'Estudiante'}
            </p>
            <p className="text-xs truncate text-gray-500 dark:text-gray-400">
              {userData?.email || ''}
            </p>
          </div>
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform flex-shrink-0 ${isUserMenuOpen ? 'transform rotate-180' : ''} text-gray-500 dark:text-gray-400`} 
        />
      </button>
      {isUserMenuOpen && (
        <div 
          className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleSignOut}
            disabled={logoutLoading}
            className={`w-full flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm ${
              logoutLoading ? 'text-gray-400' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {logoutLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cerrando sesión...
              </>
            ) : (
              <>
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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
      

      {/* Main Content */}
      <div className="ml-0 sm:ml-64 p-4 sm:p-8 md:p-12 transition-all duration-300">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header solo con texto centrado */}
            <div className="flex justify-center mt-4 mb-6">
              <h1 className="text-xl font-extrabold text-indigo-700 dark:text-indigo-300 drop-shadow-sm text-center">
                Panel de Estudiante
              </h1>
            </div>
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-4 sm:p-8">
              {mainContent}
            </div>
          </div>
        )}
      </div>
    </div>
    
  );
};

export default StudentDashboard;