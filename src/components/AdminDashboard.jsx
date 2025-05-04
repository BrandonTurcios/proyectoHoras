import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  ClipboardList, 
  BarChart2, 
  Calendar,
  Search,
  ChevronDown, 
  LogOut, 
  User
} from 'lucide-react';
import TasksManager from './TasksManager';
import Statistics from './Statistics';
import StudentSchedule from './StudentSchedule';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { userData, signOut } = useAuth();

  useEffect(() => {
    if (userData?.internship_area) {
      const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchStudents(), fetchTasks()]);
        setLoading(false);
      };
      fetchData();
    }
  }, [userData]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) { // sm breakpoint
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('internship_area', userData.internship_area);

      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          admin:users!tasks_admin_id_fkey(full_name),
          student:users!tasks_student_id_fkey(full_name),
          evidences(*)
        `)
        .eq('admin_id', userData.id);

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };
  const handleSignOut = async () => {
    setLogoutLoading(true);
    try {
      // Usamos el signOut del contexto que ahora maneja todo
      await signOut();
      // No necesitamos hacer nada más aquí
    } catch (error) {
      console.error('Error durante logout:', error);
      // Mostrar mensaje de error al usuario si es necesario
    } finally {
      setLogoutLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'students':
        return <StudentsList students={students} />;
      case 'tasks':
        return <TasksManager tasks={tasks} students={students} onTaskUpdate={fetchTasks} />;
      case 'statistics':
        return <Statistics students={students} tasks={tasks} />;
      case 'schedule':
        return selectedStudentId ? (
          <div>
            <button
              onClick={() => setSelectedStudentId(null)}
              className="mb-4 text-indigo-600 hover:underline"
            >
              ← Volver a la lista de estudiantes
            </button>
            <StudentSchedule
              studentId={selectedStudentId}
              readOnly={true}
            />
          </div>
        ) : (
          <StudentsList
            students={students}
            onSelectStudent={(id) => setSelectedStudentId(id)}
            showScheduleOption={true}
          />
        );
      default:
        return null;
    }
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-white shadow-lg sm:hidden border border-indigo-100"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed w-64 h-full bg-white/90 shadow-2xl flex flex-col transition-all duration-300 z-40 rounded-r-3xl border-r border-indigo-100 ${
        isSidebarOpen ? 'left-0' : '-left-64 sm:left-0'
      }`}>
        <div className="p-2 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-700 drop-shadow-sm">Panel de Control</h2>
          <p className="text-xs sm:text-sm text-indigo-500">{userData?.internship_area}</p>
        </div>
        
        <nav className="mt-4 sm:mt-6 flex-1">
          <button
            onClick={() => {
              setActiveTab('students');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center p-2 sm:p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'students' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Estudiantes</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('tasks');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center p-2 sm:p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <ClipboardList className="w-5 h-5 mr-3" />
            <span>Tareas</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('statistics');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center p-2 sm:p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'statistics' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <BarChart2 className="w-5 h-5 mr-3" />
            <span>Estadísticas</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('schedule');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center p-2 sm:p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <Calendar className="w-5 h-5 mr-3" />
            <span>Horarios</span>
          </button>
        </nav>

        {/* Menú de usuario */}
        <div className="p-2 sm:p-4 border-t">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                </div>
                <div className="text-left ml-3">
                  <p className="text-xs sm:text-sm font-medium truncate max-w-[120px]">
                    {userData?.full_name || 'Administrador'}
                  </p>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                    {userData?.email || ''}
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`w-4 h-4 transition-transform ${isUserMenuOpen ? 'transform rotate-180' : ''}`} 
              />
            </button>
            
            {isUserMenuOpen && (
              <div 
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg py-1 z-10 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleSignOut}
                  disabled={logoutLoading}
                  className={`w-full flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm ${
                    logoutLoading ? 'text-gray-400' : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  {logoutLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

      {/* Main Content */}
      <div className="ml-0 sm:ml-64 p-4 sm:p-8 md:p-12 transition-all duration-300">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-2xl font-extrabold text-indigo-700 drop-shadow-sm">Panel Administrativo</h1>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-block text-indigo-500 font-semibold text-lg">{userData?.full_name || 'Administrador'}</span>
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
            <div className="bg-white/90 rounded-2xl shadow-xl p-4 sm:p-8">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de lista de estudiantes
const StudentsList = ({ students, onSelectStudent, showScheduleOption }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredStudents = students
    .filter(student => 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.full_name.localeCompare(b.full_name);
      } else if (sortBy === 'hours') {
        return b.current_hours - a.current_hours;
      }
      return 0;
    });

    return (
      <div className="bg-white/90 rounded-2xl shadow-xl p-4 sm:p-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map(student => (
            <div key={student.id} className="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-white shadow-md hover:shadow-xl transition-shadow border border-indigo-100 flex flex-col h-full">
              <h3 className="font-bold text-lg text-indigo-800 mb-1 truncate">{student.full_name}</h3>
              <p className="text-indigo-500 text-sm mb-2 truncate">{student.email}</p>
              <div className="mt-3 sm:mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-xs sm:text-sm font-medium text-indigo-700">Progreso de horas</span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-700">
                    {Math.round(student.current_hours / student.hours_required * 100)}%
                  </span>
                </div>
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${Math.min(100, (student.current_hours / student.hours_required) * 100)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                      (student.current_hours / student.hours_required) * 100 >= 100 ? 'bg-green-500' : 'bg-indigo-400'
                    }`}
                  ></div>
                </div>
                <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-indigo-700">
                  {student.current_hours} de {student.hours_required} horas completadas
                </div>
              </div>
              {showScheduleOption && (
                <button
                  className="mt-3 sm:mt-4 w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 text-sm sm:text-base font-semibold shadow"
                  onClick={() => onSelectStudent(student.id)}
                >
                  Ver horario
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

export default AdminDashboard;