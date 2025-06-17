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
  User,
  Briefcase
} from 'lucide-react';
import TasksManager from './TasksManager';
import Statistics from './Statistics';
import StudentSchedule from './StudentSchedule';
import ThemeToggle from './ThemeToggle';
import WorkspacesManager from './WorkspacesManager';
import dayjs from 'dayjs';

// Paleta de colores para estudiantes
const studentColors = [
  '#6366f1', // Indigo
  '#f59e42', // Orange
  '#10b981', // Green
  '#f43f5e', // Red
  '#3b82f6', // Blue
  '#eab308', // Yellow
  '#14b8a6', // Teal
  '#f472b6', // Pink
  '#a3e635', // Lime
  //agregar mas colores
  '#DE3163',
  '#DFFF00'

];

// Asigna un color a cada estudiante por nombre
function getStudentColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return studentColors[Math.abs(hash) % studentColors.length];
}

// Nuevo componente para mostrar horarios combinados
const CombinedSchedule = ({ students }) => {
  const [combinedSchedule, setCombinedSchedule] = useState({});
  const [loading, setLoading] = useState(true);

  // Function to convert "HH:mm" or "HH:mm:ss" string to total minutes from midnight
  const timeToMinutes = (timeStr) => {
    console.log(`timeToMinutes input: ${timeStr}`); // Debug log
    const parts = timeStr.split(':').map(Number);
    const minutes = parts[0] * 60 + parts[1];
    console.log(`timeToMinutes output for ${timeStr}: ${minutes}`); // Debug log
    return minutes;
  };

  // Solo días de lunes a sábado
  const daysOfWeek = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
  ];

  // Generar bloques de 1 hora desde 06:00 a 21:00
  const hourBlocks = [];
  for (let h = 6; h < 21; h++) {
    const start = `${h.toString().padStart(2, '0')}:00`;
    const end = `${(h + 1).toString().padStart(2, '0')}:00`;
    hourBlocks.push({ start, end });
  }

  useEffect(() => {
    fetchCombinedSchedule();
  }, [students]);

  const fetchCombinedSchedule = async () => {
    try {
      setLoading(true);
      const studentIds = students.map(student => student.id);
      const { data, error } = await supabase
        .from('student_availability')
        .select(`*, student:users!student_availability_student_id_fkey(full_name)`)
        .in('student_id', studentIds);
      if (error) throw error;
      // Organizar los horarios por día
      const scheduleByDay = {};
      daysOfWeek.forEach(day => {
        scheduleByDay[day] = [];
      });
      data.forEach(slot => {
        if (scheduleByDay[slot.day_of_week]) {
          scheduleByDay[slot.day_of_week].push({
            ...slot,
            studentName: slot.student.full_name
          });
        }
      });
      setCombinedSchedule(scheduleByDay);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching combined schedule:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 overflow-x-auto">
      <div className="w-full overflow-x-auto">
        <table className="table-fixed w-full min-w-[600px] border-separate border-spacing-0 rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th className="bg-indigo-100 text-indigo-800 px-2 py-2 text-center text-lg font-bold border-b-2 border-r-2 border-indigo-300">Hora</th>
              {daysOfWeek.map(day => (
                <th key={day} className="bg-indigo-100 text-indigo-800 px-2 py-2 text-center font-bold border-b-2 border-r-2 border-indigo-300 last:border-r-0">{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hourBlocks.map(({ start, end }, rowIdx) => (
              <tr key={start}>
                <td className="bg-indigo-50 text-indigo-700 px-1 py-3 text-center text-lg font-bold border-b-2 border-r-2 border-indigo-200 w-20 leading-tight">
                  {start} - {end}
                </td>
                {daysOfWeek.map((day, colIdx) => {
                  const slotsArr = Array.isArray(combinedSchedule[day]) ? combinedSchedule[day] : [];
                  // Estudiantes presentes durante TODO el bloque (no solo solapados)
                  const slots = slotsArr.filter(slot => {
                    // Convert all times to minutes for robust comparison
                    const slotMinutesStart = timeToMinutes(slot.start_time);
                    const slotMinutesEnd = timeToMinutes(slot.end_time);
                    const blockMinutesStart = timeToMinutes(start);
                    const blockMinutesEnd = timeToMinutes(end);

                    // Debug logs for overlap logic
                    console.log(`
                      Slot Time: ${slot.start_time}-${slot.end_time} (${slotMinutesStart}-${slotMinutesEnd} min)
                      Block Time: ${start}-${end} (${blockMinutesStart}-${blockMinutesEnd} min)
                      Condition: ${slotMinutesStart} < ${blockMinutesEnd} && ${slotMinutesEnd} > ${blockMinutesStart}
                      Overlap Result: ${slotMinutesStart < blockMinutesEnd && slotMinutesEnd > blockMinutesStart}
                    `);

                    // Check for overlap: [slot.start_time, slot.end_time] overlaps with [block.start, block.end]
                    // An overlap exists if slot_start < block_end AND slot_end > block_start
                    return slotMinutesStart < blockMinutesEnd && slotMinutesEnd > blockMinutesStart;
                  });
                  return (
                    <td key={day} className={`px-0 py-3 align-top border-b-2 border-r-2 border-indigo-100 last:border-r-0 text-xs leading-tight whitespace-nowrap ${rowIdx === hourBlocks.length - 1 ? '' : ''}`}>
                      {slots.length === 0 ? (
                        <span className="text-gray-300 text-xs">-</span>
                      ) : (
                        <div className="flex flex-col items-start gap-1 w-full">
                          {slots.map((slot, idx) => {
                            const color = getStudentColor(slot.studentName);
                            return (
                              <span
                                key={idx}
                                className="sm:px-3 px-1.5 sm:py-1 py-0.5 rounded-lg sm:text-base text-xs font-semibold text-white shadow-md break-words whitespace-normal w-full"
                                style={{ background: color }}
                                title={`${slot.studentName} (${slot.start_time} - ${slot.end_time})`}
                              >
                                {slot.studentName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { userData, signOut } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchStudents(), fetchTasks(), fetchAreas()]);
      setLoading(false);
    };
   
    if (userData?.internship_area) {
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

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase
        .from('areas')
        .select('*');
      if (error) throw error;
      if (data) setAreas(data);
    } catch (error) {
      console.error("Error fetching areas:", error);
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
        return <StudentsList students={students} areas={areas} />;
       
      case 'tasks':
        return <TasksManager tasks={tasks} students={students} onTaskUpdate={fetchTasks} areas={areas} areaId={userData?.internship_area} />;
        
      case 'statistics':
        return <Statistics students={students} tasks={tasks} areas={areas} />;
        
      case 'schedule':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-xl font-semibold text-indigo-800">Gestión de Horarios</h2>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedStudentId(null)}
                  className={`px-4 py-2 rounded-lg w-full sm:w-auto ${
                    selectedStudentId === null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Vista Combinada
                </button>
                <button
                  onClick={() => setSelectedStudentId('individual')}
                  className={`px-4 py-2 rounded-lg w-full sm:w-auto ${
                    selectedStudentId === 'individual'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Horarios Individuales
                </button>
              </div>
            </div>

            {selectedStudentId === null ? (
              <CombinedSchedule students={students} />
            ) : selectedStudentId === 'individual' ? (
              <StudentsList
                students={students}
                onSelectStudent={(id) => setSelectedStudentId(id)}
                showScheduleOption={true}
                areas={areas}
              />
            ) : (
              <div>
                <button
                  onClick={() => setSelectedStudentId('individual')}
                  className="mb-4 text-indigo-600 hover:underline"
                >
                  ← Volver a la lista de estudiantes
                </button>
                <StudentSchedule
                  studentId={selectedStudentId}
                  readOnly={true}
                />
              </div>
            )}
          </div>
        );
      case 'workspaces':
        return <WorkspacesManager areaId={userData?.internship_area} />;
      default:
        return null;
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 drop-shadow-sm">Panel de Control</h2>
          <p className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400">
            {(() => {
              const areaName = areas && areas.find(a => a.id === userData?.internship_area)?.name;
              return areaName || userData?.internship_area || 'Sin área';
            })()}
          </p>
        </div>
        
        <nav className="mt-4 sm:mt-6 flex-1 flex flex-col justify-between">
          <div className="space-y-2 sm:space-y-0">
            <button
              onClick={() => {
                setActiveTab('students');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                activeTab === 'students' ? 'bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              <Users className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Estudiantes</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('tasks');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                activeTab === 'tasks' ? 'bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              <ClipboardList className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Tareas</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('statistics');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                activeTab === 'statistics' ? 'bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              <BarChart2 className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Estadísticas</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('schedule');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                activeTab === 'schedule' ? 'bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              <Calendar className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Horarios</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('workspaces');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                activeTab === 'workspaces' ? 'bg-indigo-50 dark:bg-gray-800 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            >
              <Briefcase className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Espacios de Trabajo</span>
            </button>
          </div>
        </nav>

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
              {userData?.full_name || 'Administrador'}
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
                <LogOut className="w-3 h-3 sm:w-4 sm:w-4 mr-2" />
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
                Panel Administrativo
              </h1>
            </div>
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-4 sm:p-8">
              {renderContent()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de lista de estudiantes
const StudentsList = ({ students, onSelectStudent, showScheduleOption, areas }) => {
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

  if (!filteredStudents.length) {
    return <div className="text-gray-500">No hay estudiantes para mostrar.</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredStudents.map(student => {
        const areaName = areas && areas.find(a => a.id === student.internship_area)?.name;
        const isCompleted = student.current_hours >= student.hours_required;
        const progress = (student.current_hours / student.hours_required) * 100;
        const progressColor = isCompleted ? 'bg-green-500' : 'bg-indigo-400';
        
        return (
          <div key={student.id} className="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-white shadow-md hover:shadow-xl transition-shadow border border-indigo-100 flex flex-col h-full">
            <h3 className="font-bold text-lg text-indigo-800 mb-1 truncate">{student.full_name}</h3>
            <p className="text-indigo-500 text-sm mb-2 truncate">{student.email}</p>
            <div className="mt-3 sm:mt-4">
              <div className="flex justify-between mb-1">
                <span className={`text-xs sm:text-sm font-medium ${isCompleted ? 'text-green-700' : 'text-indigo-700'}`}>
                  {isCompleted ? 'COMPLETADO' : 'Progreso de horas'}
                </span>
                <span className={`text-xs sm:text-sm font-bold ${isCompleted ? 'text-green-700' : 'text-indigo-700'}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${Math.min(100, progress)}%` }}
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor}`}
                ></div>
              </div>
              <div className={`mt-1 sm:mt-2 text-xs sm:text-sm ${isCompleted ? 'text-green-700' : 'text-indigo-700'}`}>
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
        );
      })}
    </div>
  );
};

export default AdminDashboard;