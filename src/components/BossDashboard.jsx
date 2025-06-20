import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Building2,
  BarChart2, 
  Search,
  ChevronDown, 
  LogOut, 
  User,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Mail,
  ClipboardList,
  Calendar,
  Clock,
  X,
  ExternalLink,
  Briefcase,
  LayoutGrid,
  ListIcon,
  AlertTriangle
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import * as XLSX from 'xlsx';

// Notification component (copiado de Login.jsx)
const Notification = ({ type, message, onClose }) => {
  const isError = type === 'error';
  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
      <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${
        isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
      }`}>
        <div className={`flex-shrink-0 ${isError ? 'text-red-600' : 'text-green-600'}`}> 
          {isError ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />} 
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${isError ? 'text-red-800' : 'text-green-800'}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded-full hover:bg-opacity-20 ${isError ? 'hover:bg-red-200' : 'hover:bg-green-200'}`}
        >
          <X className={`w-4 h-4 ${isError ? 'text-red-600' : 'text-green-600'}`} />
        </button>
      </div>
    </div>
  );
};

const BossDashboard = () => {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [areas, setAreas] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [students, setStudents] = useState([]);
  const [surveys, setSurveys] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [newArea, setNewArea] = useState({
    name: ''
  });
  const [requests, setRequests] = useState([]);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [isDeleteAreaModalOpen, setIsDeleteAreaModalOpen] = useState(false);
  const [dangerLoading, setDangerLoading] = useState(false);
  const [dangerMessage, setDangerMessage] = useState('');
  const [notification, setNotification] = useState(null);

  const { userData, signOut } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAdmins(),
        fetchAreas(),
        fetchRequests(),
        fetchStudents(),
        fetchAllTasks()
      ]);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timer;
    if (notification) {
      timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (activeTab === 'surveys') {
      fetchSurveys();
    }
  }, [activeTab]);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin');

      if (error) throw error;
      if (data) setAdmins(data);
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };


  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('area_change_requests')
        .select('*');
      if (error) throw error;
      if (data) setRequests(data);
    } catch (error) {
      console.error('Error fetching area change requests:', error);
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


  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student');

      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchAllTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          admin:users!tasks_admin_id_fkey(full_name),
          student:users!tasks_student_id_fkey(full_name),
          workspace:workspaces!tasks_workspace_id_fkey(id, name),
          evidences(*)
        `);

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchSurveys = async () => {
    const { data, error } = await supabase
      .from('encuestas')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setSurveys(data);
  };

  const handleAssignArea = async (adminId, areaId) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ internship_area: areaId })
        .eq('id', adminId);

      if (error) throw error;
      
      await fetchAdmins();
    } catch (error) {
      console.error("Error assigning area:", error);
    }
  };

  const handleSignOut = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error durante logout:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleApproveRequest = async (request, areaId) => {
    try {
      // Update user's area
      await supabase
        .from('users')
        .update({ internship_area: areaId })
        .eq('id', request.student_id);
      // Update request status
      await supabase
        .from('area_change_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: userData.id })
        .eq('id', request.id);
      await fetchRequests();
      await fetchAdmins();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (request) => {
    try {
      await supabase
        .from('area_change_requests')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: userData.id })
        .eq('id', request.id);
      await fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleAddArea = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('areas')
        .insert([{ name: newArea.name }]);
      if (error) throw error;
      setIsAddAreaModalOpen(false);
      setNewArea({ name: '' });
      await fetchAreas();
      setNotification({ type: 'success', message: '¡Área creada exitosamente!' });
    } catch (error) {
      console.error('Error agregando área:', error);
      setNotification({ type: 'error', message: 'Error al crear área: ' + (error.message || error) });
    }
  };

  const handleDeleteArea = async () => {
    if (!areaToDelete) return;
    try {
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', areaToDelete.id);
      if (error) throw error;
      setIsDeleteAreaModalOpen(false);
      setAreaToDelete(null);
      await fetchAreas();
    } catch (error) {
      console.error('Error eliminando área:', error);
    }
  };

  // Danger Zone functions
  const handleDangerClean = async (action) => {
    setDangerLoading(true);
    setDangerMessage('');
    setNotification(null);
    try {
      if (action === 'truncate') {
        setNotification({ type: 'success', message: '¡Tablas limpiadas exitosamente!' });
        await new Promise(r => setTimeout(r, 400));
        await Promise.all([
          supabase.from('evidences').delete().neq('id', 0),
          supabase.from('student_availability').delete().neq('id', 0),
          supabase.from('tasks').delete().neq('id', 0),
          supabase.from('area_change_requests').delete().neq('id', 0),
        ]);
      } else if (action === 'reset_hours') {
        setNotification({ type: 'success', message: '¡Horas de los estudiantes reiniciadas a 0!' });
        await new Promise(r => setTimeout(r, 400));
        await supabase.from('users').update({ current_hours: 0 }).eq('role', 'student');
      }
      await Promise.all([
        fetchRequests(),
        fetchStudents(),
        fetchAllTasks()
      ]);
    } catch (error) {
      setNotification({ type: 'error', message: 'Error: ' + error.message });
    } finally {
      setDangerLoading(false);
    }
  };

  // Exportar Excel
  const handleExportExcel = async () => {
    setDangerLoading(true);
    setDangerMessage('');
    setNotification(null);
    try {
      const [usersRes, areasRes, tasksRes, evidencesRes, availRes, requestsRes, workspacesRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('areas').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('evidences').select('*'),
        supabase.from('student_availability').select('*'),
        supabase.from('area_change_requests').select('*'),
        supabase.from('workspaces').select('*'),
      ]);
      const users = usersRes.data || [];
      const areas = areasRes.data || [];
      const tasks = tasksRes.data || [];
      const evidences = evidencesRes.data || [];
      const avail = availRes.data || [];
      const requests = requestsRes.data || [];
      const workspaces = workspacesRes.data || [];

      // 2. Procesar relaciones para que sean legibles
      const areaMap = Object.fromEntries(areas.map(a => [a.id, a.name]));
      const userMap = Object.fromEntries(users.map(u => [u.id, u.full_name]));
      const workspaceMap = Object.fromEntries(workspaces.map(w => [w.id, w.name]));

      // Usuarios
      const usersSheet = users.map(u => ({
        'ID': u.id,
        'Correo': u.email,
        'Rol': u.role,
        'Nombre completo': u.full_name,
        'Área de pasantía': areaMap[u.internship_area] || '',
        'Horas requeridas': u.hours_required,
        'Horas completadas': u.current_hours
      }));
      // Áreas
      const areasSheet = areas.map(a => ({
        'ID': a.id,
        'Nombre': a.name
      }));
      // Tareas
      const tasksSheet = tasks.map(t => ({
        'ID': t.id,
        'Título': t.title,
        'Descripción': t.description,
        'Horas requeridas': t.required_hours,
        'Fecha de entrega': t.due_date,
        'Estudiante': userMap[t.student_id] || t.student_id,
        'Administrador': userMap[t.admin_id] || t.admin_id,
        'Estado': t.status,
        'Espacio': workspaceMap[t.workspace_id] || t.workspace_id,
        'Fecha de creación': t.created_at,
        'URL de evidencia PDF': t.evidence_pdf_url
      }));
      // Evidencias
      const evidencesSheet = evidences.map(e => ({
        'ID': e.id,
        'Tarea': tasks.find(t => t.id === e.task_id)?.title || e.task_id,
        'Estudiante': userMap[e.student_id] || e.student_id,
        'Descripción': e.description,
        'Horas dedicadas': e.hours_spent,
        'Fecha de envío': e.submitted_at
      }));
      // Disponibilidad
      const availSheet = avail.map(a => ({
        'ID': a.id,
        'Estudiante': userMap[a.student_id] || a.student_id,
        'Día de la semana': a.day_of_week,
        'Hora de inicio': a.start_time,
        'Hora de fin': a.end_time
      }));
      // Solicitudes de cambio de área
      const requestsSheet = requests.map(r => ({
        'ID': r.id,
        'Estudiante': userMap[r.student_id] || r.student_id,
        'Área actual': areaMap[r.current_area] || r.current_area,
        'Razón': r.reason,
        'Estado': r.status,
        'Fecha de solicitud': r.created_at,
        'Fecha de revisión': r.reviewed_at,
        'Revisado por': userMap[r.reviewed_by] || r.reviewed_by
      }));
      // Espacios
      const workspacesSheet = workspaces.map(w => ({
        'ID': w.id,
        'Nombre': w.name,
        'Área': areaMap[w.area_id] || w.area_id
      }));

      // 3. Crear el libro de Excel
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersSheet), 'Usuarios');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(areasSheet), 'Áreas');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tasksSheet), 'Tareas');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(evidencesSheet), 'Evidencias');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(availSheet), 'Disponibilidad');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(requestsSheet), 'Solicitudes de área');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(workspacesSheet), 'Espacios');

      // 4. Descargar el archivo
      XLSX.writeFile(wb, 'reporte_completo_bd.xlsx');
    } catch (error) {
      setNotification({ type: 'error', message: 'Error al exportar: ' + error.message });
    } finally {
      setDangerLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'admins':
        return <AdminsList admins={admins} areas={areas} onAssignArea={handleAssignArea} />;
       
      case 'areas':
        return <AreasList areas={areas} setIsAddAreaModalOpen={setIsAddAreaModalOpen} setAreaToDelete={setAreaToDelete} setIsDeleteAreaModalOpen={setIsDeleteAreaModalOpen} />;
        
      case 'statistics':
        return <Statistics admins={admins} areas={areas} students={students} />;
      case 'requests':
        return <RequestsList requests={requests} areas={areas} students={students} onApprove={handleApproveRequest} onReject={handleRejectRequest} />;
      case 'tasks':
        return <TasksList tasks={tasks} admins={admins} students={students} />;
      case 'students':
        return <StudentsList students={students} areas={areas} />;
        case 'surveys':
          return <SurveysList surveys={surveys} />;
      case 'danger':
        return <DangerZone onDangerClean={handleDangerClean} loading={dangerLoading} onExportExcel={handleExportExcel} />;
     
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 drop-shadow-sm">Panel de Jefe</h2>
          <p className="text-xs sm:text-sm text-indigo-500 dark:text-indigo-400">Gestión de Áreas</p>
        </div>
        
        <nav className="mt-4 sm:mt-6 flex-1 flex flex-col justify-between">
          <div className="space-y-2 sm:space-y-0">
            <button
              onClick={() => {
                setActiveTab('admins');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                activeTab === 'admins' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <Users className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Administradores</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('students');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                activeTab === 'students' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <Users className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Becados</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('areas');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                activeTab === 'areas' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <Building2 className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Áreas</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('tasks');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-600' : ''
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
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                activeTab === 'statistics' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <BarChart2 className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Estadísticas</span>
            </button>
            
            <button
              onClick={() => {
                setActiveTab('requests');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                activeTab === 'requests' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <Mail className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Solicitudes</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('surveys');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
                activeTab === 'surveys' ? 'bg-indigo-50 text-indigo-600' : ''
              }`}
            >
              <BarChart2 className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base">Encuestas</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('danger');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center py-6 sm:py-4 px-4
                text-gray-600 dark:text-red-300
                hover:bg-red-50 hover:text-red-600
                dark:hover:bg-red-900/30 dark:hover:text-red-300
                ${activeTab === 'danger'
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                  : ''}
              `}
            >
              <AlertTriangle className="w-7 h-7 sm:w-5 sm:h-5 mr-4 sm:mr-3" />
              <span className="text-lg sm:text-base font-bold">Zona de peligro</span>
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
              {userData?.full_name || 'Jefe'}
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
                Panel de Jefe
              </h1>
            </div>
            <div className="bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-xl p-4 sm:p-8">
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {/* Add Area Modal */}
      {isAddAreaModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-indigo-700 dark:text-indigo-200 mb-4">Agregar Nueva Área</h3>
            <form onSubmit={handleAddArea}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre del Área</label>
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddAreaModalOpen(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Area Modal */}
      {isEditAreaModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-indigo-700 mb-4">Editar Área</h3>
            <form onSubmit={handleEditArea}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Área</label>
                <input
                  type="text"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={newArea.description}
                  onChange={(e) => setNewArea({ ...newArea, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditAreaModalOpen(false);
                    setSelectedArea(null);
                    setNewArea({ name: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar área */}
      {isDeleteAreaModalOpen && areaToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-4">Eliminar Área</h3>
            <p className="mb-4 text-gray-700 dark:text-gray-200">¿Estás seguro de que deseas eliminar el área <span className="font-bold">{areaToDelete.name}</span>? Esta acción no se puede deshacer y eliminará todo lo relacionado.</p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsDeleteAreaModalOpen(false); setAreaToDelete(null); }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteArea}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de lista de administradores
const AdminsList = ({ admins, areas, onAssignArea }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState('all');
  const [compactView, setCompactView] = useState(false);

  const filteredAdmins = admins
    .filter(admin =>
      admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(admin =>
      selectedArea === 'all' ? true : admin.internship_area === selectedArea
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar administradores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedArea}
            onChange={e => setSelectedArea(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="all">Todas las áreas</option>
            {areas.map(area => (
              <option key={area.id} value={area.id}>{area.name}</option>
            ))}
            <option value="">Sin asignar</option>
          </select>
          <button
            onClick={() => setCompactView(v => !v)}
            className="border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-900"
            title={compactView ? 'Vista de tarjetas' : 'Vista de lista'}
          >
            {compactView ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <ListIcon className="w-4 h-4" />
            )}
            <span>{compactView ? 'Tarjetas' : 'Lista'}</span>
          </button>
        </div>
      </div>

      {filteredAdmins.length === 0 ? (
        <div className="text-gray-500">No hay administradores para mostrar.</div>
      ) : compactView ? (
        // Vista de lista compacta
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-indigo-200 dark:divide-gray-700 text-sm">
            <thead className="bg-indigo-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Nombre</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Área</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Asignar Área</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-indigo-100 dark:divide-gray-800">
              {filteredAdmins.map(admin => {
                const areaName = areas && areas.find(a => a.id === admin.internship_area)?.name;
                return (
                  <tr key={admin.id} className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-3 py-2 font-medium text-indigo-900 dark:text-indigo-100">{admin.full_name}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{admin.email}</td>
                    <td className="px-3 py-2 text-indigo-700 dark:text-indigo-300">{areaName || 'Sin asignar'}</td>
                    <td className="px-3 py-2">
                      <select
                        value={admin.internship_area || ''}
                        onChange={(e) => onAssignArea(admin.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="">Sin asignar</option>
                        {areas.map(area => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Vista de tarjetas (actual)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdmins.map(admin => {
            const areaName = areas && areas.find(a => a.id === admin.internship_area)?.name;
            return (
              <div
                key={admin.id}
                className="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-white shadow-md hover:shadow-xl transition-shadow border border-indigo-100 flex flex-col h-full"
              >
                <h3 className="font-bold text-lg text-indigo-800 mb-1 truncate">{admin.full_name}</h3>
                <p className="text-indigo-500 text-sm mb-2 truncate">{admin.email}</p>
                <div className="mt-3 sm:mt-4">
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Área Asignada</label>
                    <select
                      value={admin.internship_area || ''}
                      onChange={(e) => onAssignArea(admin.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Sin asignar</option>
                      {areas.map(area => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  </div>
                
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Componente de lista de áreas (solo muestra las dummy)
const AreasList = ({ areas, setIsAddAreaModalOpen, setAreaToDelete, setIsDeleteAreaModalOpen }) => {
  const [compactView, setCompactView] = useState(false);
  const sortedAreas = [...areas].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-200">Áreas de Pasantía</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsAddAreaModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Agregar Área
          </button>
          <button
            onClick={() => setCompactView(v => !v)}
            className="border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-900"
            title={compactView ? 'Vista de tarjetas' : 'Vista de lista'}
          >
            {compactView ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <ListIcon className="w-4 h-4" />
            )}
            <span>{compactView ? 'Tarjetas' : 'Lista'}</span>
          </button>
        </div>
      </div>
      {compactView ? (
        // Vista de lista compacta
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-indigo-200 dark:divide-gray-700 text-sm">
            <thead className="bg-indigo-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Nombre del Área</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-indigo-100 dark:divide-gray-800">
              {sortedAreas.map(area => (
                <tr key={area.id} className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-3 py-2 font-medium text-indigo-900 dark:text-indigo-100">{area.name}</td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => { setAreaToDelete(area); setIsDeleteAreaModalOpen(true); }}
                      className="p-1 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-700 text-red-600 dark:text-red-300 transition-colors"
                      title="Eliminar área"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Vista de tarjetas (actual)
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {sortedAreas.map(area => (
            <div key={area.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow border border-indigo-100 dark:border-indigo-700 min-h-[70px] flex flex-col justify-center transition-colors relative group">
              <h3 className="font-bold text-base text-indigo-800 dark:text-indigo-200 mb-1 break-words">{area.name}</h3>
              <button
                title="Eliminar área"
                onClick={() => { setAreaToDelete(area); setIsDeleteAreaModalOpen(true); }}
                className="absolute top-2 right-2 p-1 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-700 text-red-600 dark:text-red-300 transition-opacity opacity-80 group-hover:opacity-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de estadísticas mejorado
const Statistics = ({ admins, areas, students }) => {
  const totalAdmins = admins.length;
  const totalAreas = areas.length;
  const assignedAdmins = admins.filter(admin => admin.internship_area).length;

  const totalStudents = students.length;
  const assignedStudents = students.filter(student => student.internship_area).length;
  const completedStudents = students.filter(student => student.current_hours >= student.hours_required).length;
  const inProgressStudents = totalStudents - completedStudents;
  const avgHours = totalStudents > 0
    ? Math.round(students.reduce((sum, s) => sum + (s.current_hours || 0), 0) / totalStudents)
    : 0;

  // Áreas con más/menos becados
  const areaStudentCounts = areas.map(area => ({
    name: area.name,
    count: students.filter(s => s.internship_area === area.id).length
  }));
  const mostPopulatedArea = areaStudentCounts.reduce((max, a) => a.count > max.count ? a : max, {name: '', count: 0});
  const leastPopulatedArea = areaStudentCounts.reduce((min, a) => (a.count < min.count ? a : min), {name: '', count: Infinity});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Total de Administradores</h3>
        <p className="text-3xl font-bold text-indigo-600">{totalAdmins}</p>
        <p className="text-sm text-gray-500 mt-2">{assignedAdmins} asignados a un área</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Total de Becados</h3>
        <p className="text-3xl font-bold text-indigo-600">{totalStudents}</p>
        <p className="text-sm text-gray-500 mt-2">{assignedStudents} asignados a un área</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Total de Áreas</h3>
        <p className="text-3xl font-bold text-indigo-600">{totalAreas}</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Becados Completados</h3>
        <p className="text-3xl font-bold text-green-600">{completedStudents}</p>
        <p className="text-sm text-gray-500 mt-2">{inProgressStudents} en progreso</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Promedio de Horas Completadas</h3>
        <p className="text-3xl font-bold text-indigo-600">{avgHours}</p>
        <p className="text-sm text-gray-500 mt-2">por becado</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Áreas con más/menos becados</h3>
        <p className="text-sm text-gray-700 mb-1">
          <span className="font-semibold text-green-700">Más:</span> {mostPopulatedArea.name || 'N/A'} ({mostPopulatedArea.count})
        </p>
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-red-700">Menos:</span> {leastPopulatedArea.name || 'N/A'} ({leastPopulatedArea.count === Infinity ? 0 : leastPopulatedArea.count})
        </p>
      </div>
    </div>
  );
};

const RequestsList = ({ requests, areas, students, onApprove, onReject }) => {
  const [statusFilter, setStatusFilter] = useState('pending');
  const [studentFilter, setStudentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedAreaIds, setSelectedAreaIds] = useState({}); // { [requestId]: areaId }

  // Only students (not admins, bosses, etc)
  const studentOptions = students.filter(s => s.role === 'student');

  const filteredRequests = requests.filter(r => {
    const statusMatch = statusFilter === 'all' ? true : r.status === statusFilter;
    const studentMatch = studentFilter === '' ? true : r.student_id === studentFilter;
    const dateMatch = dateFilter === '' ? true : (r.created_at && r.created_at.startsWith(dateFilter));
    return statusMatch && studentMatch && dateMatch;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">Solicitudes de Cambio de Área</h2>
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="all">Todas</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Estudiante</label>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
            value={studentFilter}
            onChange={e => setStudentFilter(e.target.value)}
          >
            <option value="">Todos</option>
            {studentOptions.map(student => (
              <option key={student.id} value={student.id}>{student.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
        </div>
      </div>
      {filteredRequests.length === 0 ? (
        <div className="text-gray-500">No hay solicitudes para los filtros seleccionados.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map(req => (
            <div key={req.id} className="bg-white rounded-xl p-6 shadow-md border border-indigo-100 flex flex-col gap-2">
              <div className="font-bold text-indigo-800">
                Estudiante: {students.find(s => s.id === req.student_id)?.full_name || req.student_id}
              </div>
              <div className="text-sm text-gray-700">Área actual: {areas.find(a => a.id === req.current_area)?.name || req.current_area}</div>
              <div className="text-sm text-gray-700">Razón: {req.reason}</div>
              <div className="text-xs text-gray-400">Fecha: {req.created_at ? req.created_at.split('T')[0] : ''}</div>
              {req.status === 'pending' && (
                <div className="flex flex-col gap-2 mt-2">
                  <select
                    className="border rounded-lg px-3 py-2 text-sm"
                    value={selectedAreaIds[req.id] || ''}
                    onChange={e => setSelectedAreaIds(prev => ({ ...prev, [req.id]: e.target.value }))}
                  >
                    <option value="">Selecciona nueva área</option>
                    {areas.map(area => (
                      <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onApprove(req, selectedAreaIds[req.id])}
                      disabled={!selectedAreaIds[req.id]}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />Aprobar
                    </button>
                    <button
                      onClick={() => onReject(req)}
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-2" />Rechazar
                    </button>
                  </div>
                </div>
              )}
              {req.status !== 'pending' && (
                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold w-max ${
                  req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {req.status === 'approved' ? 'Aprobada' : 'Rechazada'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Update TasksList component
const TasksList = ({ tasks, admins, students }) => {
  const [filter, setFilter] = useState('all');
  const [selectedAdmin, setSelectedAdmin] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [compactView, setCompactView] = useState(false);

  const isTaskOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    return today > taskDueDate;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesAdmin = selectedAdmin === 'all' || task.admin_id === selectedAdmin;
    const matchesStudent = selectedStudent === 'all' || task.student_id === selectedStudent;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesAdmin && matchesStudent && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar tareas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="submitted">Enviadas</option>
          <option value="approved">Aprobadas</option>
        </select>
        <select
          value={selectedAdmin}
          onChange={(e) => setSelectedAdmin(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Todos los administradores</option>
          {admins.map(admin => (
            <option key={admin.id} value={admin.id}>
              {admin.full_name}
            </option>
          ))}
        </select>
        <select
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="all">Todos los estudiantes</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>
              {student.full_name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setCompactView(v => !v)}
          className="border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-900"
          title={compactView ? 'Vista de tarjetas' : 'Vista de lista'}
        >
          {compactView ? (
            <LayoutGrid className="w-4 h-4" />
          ) : (
            <ListIcon className="w-4 h-4" />
          )}
          <span>{compactView ? 'Tarjetas' : 'Lista'}</span>
        </button>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="text-gray-500">No hay tareas para mostrar.</div>
      ) : compactView ? (
        // Vista de lista compacta
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-indigo-200 dark:divide-gray-700 text-sm">
            <thead className="bg-indigo-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Título</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Descripción</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Estudiante</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Administrador</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Estado</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Entrega</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Horas</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Espacio</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-indigo-100 dark:divide-gray-800">
              {filteredTasks.map(task => (
                <tr key={task.id} className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors">
                  <td className="px-3 py-2 font-medium text-indigo-900 dark:text-indigo-100 max-w-[180px] truncate" title={task.title}>{task.title}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300 max-w-[220px] truncate" title={task.description}>{task.description}</td>
                  <td className="px-3 py-2 text-indigo-700 dark:text-indigo-300">{task.student?.full_name || 'Sin asignar'}</td>
                  <td className="px-3 py-2 text-indigo-700 dark:text-indigo-300">{task.admin?.full_name || 'Sin asignar'}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      task.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      task.status === 'submitted' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {task.status === 'approved' ? 'Aprobada' :
                       task.status === 'submitted' ? 'Enviada' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{task.due_date?.slice(0, 10)}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{task.required_hours}</td>
                  <td className="px-3 py-2 text-indigo-700 dark:text-indigo-300">{task.workspace?.name || 'Sin espacio'}</td>
                  <td className="px-3 py-2">
                    {(task.status === 'submitted' || task.status === 'approved') && (
                      <button
                        onClick={() => setSelectedTask(task)}
                        className={`px-3 py-1 rounded-lg text-white text-xs font-semibold shadow transition-all ${
                          task.status === 'approved'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Ver Evidencia
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // Vista de tarjetas (actual)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <div key={task.id} className="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-white shadow-md hover:shadow-xl transition-shadow border border-indigo-100 flex flex-col h-full">
              <div className="flex flex-wrap items-start mb-3 sm:mb-4 gap-2 w-full">
                <div className="relative group flex-1 min-w-0">
                  <h3 className="font-bold text-lg sm:text-xl text-indigo-800 dark:text-indigo-300 break-words flex-1 min-w-0 truncate" title={task.title}>
                    {task.title}
                  </h3>
                  {/* Tooltip for long titles */}
                  <div className="hidden group-hover:block absolute left-0 top-full z-10 mt-1 w-max max-w-xs bg-indigo-900 dark:bg-indigo-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg whitespace-pre-line break-words">
                    {task.title}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-md max-w-full truncate ${
                  task.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white' :
                  task.status === 'submitted' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                  'bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 dark:text-yellow-100'
                }`}>
                  {task.status === 'approved' ? 'Aprobada' :
                   task.status === 'submitted' ? 'Enviada' : 'Pendiente'}
                </span>
                  {isTaskOverdue(task.due_date) && task.status === 'pending' && (
                    <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-md bg-gradient-to-r from-red-400 to-red-600 text-white">
                      Atrasada
                    </span>
                  )}
                </div>
              </div>
              <div className="relative group mb-3 sm:mb-4">
                <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg line-clamp-3" title={task.description}>
                  {task.description}
                </p>
                {/* Tooltip for long descriptions */}
                <div className="hidden group-hover:block absolute left-0 top-full z-10 mt-1 w-max max-w-xs bg-indigo-900 dark:bg-indigo-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg whitespace-pre-line break-words">
                  {task.description}
                </div>
              </div>
              <div className="space-y-3 text-xs sm:text-sm mt-auto">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                  <span className="break-words">Entrega: {task.due_date?.slice(0, 10)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                  <span className="break-words">{task.required_hours} horas requeridas</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                  <span className="break-words">Espacio: <span className="font-bold text-indigo-700 dark:text-indigo-400">{task.workspace?.name || 'Sin espacio'}</span></span>
                </div>
                <div className="bg-indigo-100/80 dark:bg-indigo-900/30 p-3 rounded-lg border-2 border-indigo-200 dark:border-indigo-800 shadow-sm">
                  <div className="flex items-center mb-2">
                    <User className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-indigo-700 dark:text-indigo-300 font-medium">Asignación</span>
                  </div>
                  <div className="space-y-2 pl-6">
                    <div className="flex items-center">
                      <span className="text-gray-700 dark:text-gray-400">Estudiante:</span>
                      <span className="ml-2 font-semibold text-indigo-800 dark:text-indigo-300">
                        {task.student?.full_name || 'Sin asignar'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-700 dark:text-gray-400">Administrador:</span>
                      <span className="ml-2 font-semibold text-indigo-800 dark:text-indigo-300">
                        {task.admin?.full_name || 'Sin asignar'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {(task.status === 'submitted' || task.status === 'approved') && (
                <button
                  onClick={() => setSelectedTask(task)}
                  className={`mt-4 w-full px-4 py-2 rounded-xl text-white text-base font-semibold shadow-lg transition-all duration-150 ${
                    task.status === 'approved' 
                      ? 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800' 
                      : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'
                  }`}
                >
                  Ver Evidencia
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Evidence Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Revisión de Evidencia</h2>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="space-y-4">
             
              <div>
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Horas dedicadas:</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                  {selectedTask.evidences?.[0]?.hours_spent || selectedTask.required_hours} horas
                </p>
              </div>
              {selectedTask.evidence_pdf_url && (
                <a
                  href={selectedTask.evidence_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                >
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Ver PDF
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de lista de estudiantes
const StudentsList = ({ students, areas }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [compactView, setCompactView] = useState(false);

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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar estudiantes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="hours">Ordenar por horas</option>
          </select>
          <button
            onClick={() => setCompactView(v => !v)}
            className="border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-900"
            title={compactView ? 'Vista de tarjetas' : 'Vista de lista'}
          >
            {compactView ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <ListIcon className="w-4 h-4" />
            )}
            <span>{compactView ? 'Tarjetas' : 'Lista'}</span>
          </button>
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-gray-500">No hay estudiantes para mostrar.</div>
      ) : compactView ? (
        // Vista de lista compacta
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-indigo-200 dark:divide-gray-700 text-sm">
            <thead className="bg-indigo-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Nombre</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Email</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Área</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Progreso</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Horas</th>
                <th className="px-3 py-2 text-left font-semibold text-indigo-700 dark:text-indigo-300">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-indigo-100 dark:divide-gray-800">
              {filteredStudents.map(student => {
                const areaName = areas && areas.find(a => a.id === student.internship_area)?.name;
                const isCompleted = student.current_hours >= student.hours_required;
                const progress = (student.current_hours / student.hours_required) * 100;
                
                return (
                  <tr key={student.id} className="hover:bg-indigo-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-3 py-2 font-medium text-indigo-900 dark:text-indigo-100">{student.full_name}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{student.email}</td>
                    <td className="px-3 py-2 text-indigo-700 dark:text-indigo-300">{areaName || 'Sin asignar'}</td>
                    <td className="px-3 py-2">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-indigo-400'}`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                      {student.current_hours} / {student.hours_required}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
                      }`}>
                        {isCompleted ? 'Completado' : 'En progreso'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        // Vista de tarjetas (actual)
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
                  <div className="mt-2 text-base text-gray-600">
                    Área asignada: {areaName || 'Sin asignar'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// DangerZone component
const DangerZone = ({ onDangerClean, loading, onExportExcel }) => {
  const [confirm, setConfirm] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    let timer;
    if (notification) {
      timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [notification]);

  // Danger zone actions con notificación local
  const handleDangerCleanLocal = async (action) => {
    try {
      if (action === 'truncate') {
        setNotification({ type: 'success', message: '¡Tablas limpiadas exitosamente!' });
        await new Promise(r => setTimeout(r, 400));
        await Promise.all([
          supabase.from('evidences').delete().neq('id', 0),
          supabase.from('student_availability').delete().neq('id', 0),
          supabase.from('tasks').delete().neq('id', 0),
          supabase.from('area_change_requests').delete().neq('id', 0),
        ]);
      } else if (action === 'reset_hours') {
        setNotification({ type: 'success', message: '¡Horas de los estudiantes reiniciadas a 0!' });
        await new Promise(r => setTimeout(r, 400));
        await supabase.from('users').update({ current_hours: 0 }).eq('role', 'student');
      }
      setConfirm('');
      // No refrescamos datos aquí, lo hace el dashboard global
    } catch (error) {
      setNotification({ type: 'error', message: 'Error: ' + error.message });
    }
  };

  return (
    <>
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="max-w-xl w-full mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-red-400 mt-8 sm:mt-12 flex flex-col gap-4 sm:gap-6 transition-colors duration-200">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-300">Zona de peligro</h2>
        </div>
        <p className="mb-2 sm:mb-4 text-red-600 dark:text-red-300 font-semibold">¡Cuidado! Estas acciones son irreversibles y afectarán a toda la base de datos.</p>
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Escribe <span className="font-bold">BORRAR</span> para habilitar los botones:</label>
          <input
            type="text"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors duration-200"
          />
        </div>
        <div className="flex flex-col gap-3 sm:gap-4 w-full">
          <button
            disabled={loading || confirm !== 'BORRAR'}
            onClick={() => handleDangerCleanLocal('truncate')}
            className={`w-full px-4 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors ${loading || confirm !== 'BORRAR' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Vaciar tablas críticas
          </button>
          <button
            disabled={loading || confirm !== 'BORRAR'}
            onClick={() => handleDangerCleanLocal('reset_hours')}
            className={`w-full px-4 py-2 rounded-lg font-bold text-white bg-orange-500 hover:bg-orange-600 transition-colors ${loading || confirm !== 'BORRAR' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Reiniciar horas de estudiantes a 0
          </button>
          <button
            disabled={loading}
            onClick={onExportExcel}
            className={`w-full px-4 py-2 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Exportar Excel de toda la base de datos
          </button>
        </div>
      </div>
    </>
  );
};

// Componente para mostrar estrellas
const StarBar = ({ value, max = 5, size = 24 }) => (
  <div className="flex items-center gap-1">
    {[...Array(max)].map((_, i) => (
      <svg
        key={i}
        width={size}
        height={size}
        fill={i < value ? '#fbbf24' : '#e5e7eb'}
        viewBox="0 0 24 24"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
      </svg>
    ))}
    <span className="ml-2 font-bold text-lg">{value.toFixed(2)}</span>
  </div>
);

const SurveysList = ({ surveys }) => {
  if (!surveys || surveys.length === 0) {
    return <div className="text-gray-500 py-8 text-center">No hay encuestas registradas.</div>;
  }

  // Calcular promedios
  const avg = (key) => surveys.reduce((a, b) => a + (b[key] || 0), 0) / surveys.length;
  const avgUsage = avg('usage');
  const avgEase = avg('ease');
  const avgGraphics = avg('graphics');

  // Distribución de respuestas
  const getDist = (key) => {
    const dist = [0, 0, 0, 0, 0];
    surveys.forEach(s => {
      if (s[key] >= 1 && s[key] <= 5) dist[s[key] - 1]++;
    });
    return dist;
  };
  const distUsage = getDist('usage');
  const distEase = getDist('ease');
  const distGraphics = getDist('graphics');

  return (
    <div className="space-y-8">
      {/* Promedios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <h3 className="font-bold text-indigo-700 mb-2">Uso de aplicación</h3>
          <StarBar value={avgUsage} />
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <h3 className="font-bold text-indigo-700 mb-2">Facilidad</h3>
          <StarBar value={avgEase} />
        </div>
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <h3 className="font-bold text-indigo-700 mb-2">Calidad gráfica</h3>
          <StarBar value={avgGraphics} />
        </div>
      </div>

      {/* Distribución */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[{label: 'Uso', dist: distUsage}, {label: 'Facilidad', dist: distEase}, {label: 'Gráfica', dist: distGraphics}].map(({label, dist}) => (
          <div key={label} className="bg-white rounded-xl shadow p-6">
            <h4 className="font-semibold text-indigo-600 mb-2">{label} - Distribución</h4>
            <div className="flex items-end gap-2 h-24">
              {dist.map((count, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div
                    className="w-6 bg-indigo-400 rounded-t"
                    style={{ height: `${count * 12}px` }}
                    title={`${count} respuestas`}
                  />
                  <span className="text-xs mt-1">{i + 1}★</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Comentarios */}
      <div>
        <h3 className="font-bold text-indigo-700 mb-2">Comentarios</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {surveys.filter(s => s.comment && s.comment.trim()).map(s => (
            <div key={s.id} className="bg-indigo-50 dark:bg-gray-800 rounded-lg p-4 shadow text-gray-800 dark:text-gray-100">
              <div className="text-sm">{s.comment}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">{new Date(s.created_at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabla detallada */}
      <div>
        <h3 className="font-bold text-indigo-700 mb-2">Todas las respuestas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Uso</th>
                <th className="px-4 py-2">Facilidad</th>
                <th className="px-4 py-2">Gráfica</th>
                <th className="px-4 py-2">Comentario</th>
                <th className="px-4 py-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map(s => (
                <tr key={s.id}>
                  <td className="border px-4 py-2">{s.id}</td>
                  <td className="border px-4 py-2">{s.usage}</td>
                  <td className="border px-4 py-2">{s.ease}</td>
                  <td className="border px-4 py-2">{s.graphics}</td>
                  <td className="border px-4 py-2">{s.comment}</td>
                  <td className="border px-4 py-2">{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resumen final */}
      <div className="mt-8 rounded-xl p-6 text-center font-semibold text-lg bg-indigo-100 dark:bg-gray-800 text-indigo-900 dark:text-gray-100">
        <span>Se han recibido <b>{surveys.length}</b> encuestas.</span>
      </div>
    </div>
  );
};

export default BossDashboard; 