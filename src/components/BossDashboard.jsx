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
  ExternalLink
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const BossDashboard = () => {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [areas, setAreas] = useState([]);
  const [tasks, setTasks] = useState([]);
  
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
  const [students, setStudents] = useState([]);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [isDeleteAreaModalOpen, setIsDeleteAreaModalOpen] = useState(false);
 

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
      const { data, error } = await supabase.from('users').select('id, full_name, role');
      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
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
          evidences(*)
        `);

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
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
    } catch (error) {
      console.error('Error agregando área:', error);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'admins':
        return <AdminsList admins={admins} areas={areas} onAssignArea={handleAssignArea} />;
       
      case 'areas':
        return <AreasList areas={areas} setIsAddAreaModalOpen={setIsAddAreaModalOpen} setAreaToDelete={setAreaToDelete} setIsDeleteAreaModalOpen={setIsDeleteAreaModalOpen} />;
        
      case 'statistics':
        return <Statistics admins={admins} areas={areas} />;
      case 'requests':
        return <RequestsList requests={requests} areas={areas} students={students} onApprove={handleApproveRequest} onReject={handleRejectRequest} />;
      case 'tasks':
        return <TasksList tasks={tasks} admins={admins} />;
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
        
        <nav className="mt-4 sm:mt-6 flex-1">
          <button
            onClick={() => {
              setActiveTab('admins');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center p-2 sm:p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'admins' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            <span>Administradores</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('areas');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center p-2 sm:p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'areas' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <Building2 className="w-5 h-5 mr-3" />
            <span>Áreas</span>
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
              setActiveTab('requests');
              setIsSidebarOpen(false);
            }}
            className={`w-full flex items-center p-2 sm:p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'requests' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <Mail className="w-5 h-5 mr-3" />
            <span>Solicitudes</span>
          </button>
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

  const filteredAdmins = admins.filter(admin =>
    admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar administradores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAdmins.map(admin => (
          <div key={admin.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-indigo-100 dark:border-gray-700">
            <h3 className="font-bold text-lg text-indigo-800 dark:text-indigo-300 mb-1">{admin.full_name}</h3>
            <p className="text-indigo-500 dark:text-indigo-400 text-sm mb-4">{admin.email}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Área Asignada</label>
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
        ))}
      </div>
    </div>
  );
};

// Componente de lista de áreas (solo muestra las dummy)
const AreasList = ({ areas, setIsAddAreaModalOpen, setAreaToDelete, setIsDeleteAreaModalOpen }) => {
  const sortedAreas = [...areas].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-200">Áreas de Pasantía</h2>
        <button
          onClick={() => setIsAddAreaModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Agregar Área
        </button>
      </div>
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
    </div>
  );
};

// Componente de estadísticas
const Statistics = ({ admins, areas }) => {
  const totalAdmins = admins.length;
  const totalAreas = areas.length;
  const assignedAdmins = admins.filter(admin => admin.internship_area).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Total de Administradores</h3>
        <p className="text-3xl font-bold text-indigo-600">{totalAdmins}</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Total de Áreas</h3>
        <p className="text-3xl font-bold text-indigo-600">{totalAreas}</p>
      </div>
      <div className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
        <h3 className="text-lg font-bold text-indigo-800 mb-2">Administradores Asignados</h3>
        <p className="text-3xl font-bold text-indigo-600">{assignedAdmins}</p>
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
const TasksList = ({ tasks, admins }) => {
  const [filter, setFilter] = useState('all');
  const [selectedAdmin, setSelectedAdmin] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

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
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesAdmin && matchesSearch;
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <div key={task.id} className="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-xl transition-shadow border border-indigo-100 dark:border-gray-700 flex flex-col h-full">
            <div className="flex flex-wrap items-start mb-3 sm:mb-4 gap-2 w-full">
              <div className="relative group flex-1 min-w-0">
                <h3 className="font-bold text-lg sm:text-xl text-indigo-800 dark:text-indigo-300 break-words flex-1 min-w-0 truncate" title={task.title}>
                  {task.title}
                </h3>
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
            <p className="text-gray-700 dark:text-gray-300 text-base sm:text-lg mb-3 sm:mb-4 break-words">{task.description}</p>
            <div className="space-y-3 text-xs sm:text-sm mt-auto">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                <span className="break-words">Entrega: {new Date(task.due_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                <span className="break-words">{task.required_hours} horas requeridas</span>
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

export default BossDashboard; 