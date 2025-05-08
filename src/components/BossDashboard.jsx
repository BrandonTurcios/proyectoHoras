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
  Mail
  Trash2,
  CheckCircle,
  XCircle,
  Mail
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const BossDashboard = () => {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
  const [areas, setAreas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddAreaModalOpen, setIsAddAreaModalOpen] = useState(false);
  const [isEditAreaModalOpen, setIsEditAreaModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(null);
  const [newArea, setNewArea] = useState({
    name: '',
    description: ''
  });
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);

  const { userData, signOut } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchAdmins();
      await fetchAreas();
      await fetchRequests();
      await fetchStudents();
      await fetchAreas();
      await fetchRequests();
      await fetchStudents();
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

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, full_name, role');
      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
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

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, full_name, role');
      if (error) throw error;
      if (data) setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'admins':
        return <AdminsList admins={admins} areas={areas} onAssignArea={handleAssignArea} />;
        return <AdminsList admins={admins} areas={areas} onAssignArea={handleAssignArea} />;
      case 'areas':
        return <AreasList areas={areas} />;
        return <AreasList areas={areas} />;
      case 'statistics':
        return <Statistics admins={admins} areas={areas} />;
      case 'requests':
        return <RequestsList requests={requests} areas={areas} students={students} onApprove={handleApproveRequest} onReject={handleRejectRequest} />;
        return <Statistics admins={admins} areas={areas} />;
      case 'requests':
        return <RequestsList requests={requests} areas={areas} students={students} onApprove={handleApproveRequest} onReject={handleRejectRequest} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-indigo-200 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-gray-900 shadow-lg sm:hidden border border-indigo-100 dark:border-gray-800"
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
      <div className={`fixed w-64 h-full bg-white/90 dark:bg-gray-900/95 shadow-2xl flex flex-col transition-all duration-300 z-40 rounded-r-3xl border-r border-indigo-100 dark:border-gray-800 ${
        isSidebarOpen ? 'left-0' : '-left-64 sm:left-0'
      }`}>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 drop-shadow-sm">Panel de Jefe</h1>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-block text-indigo-500 dark:text-indigo-400 font-semibold text-lg">{userData?.full_name || 'Jefe'}</span>
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <User className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
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
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-indigo-700 mb-4">Agregar Nueva Área</h3>
            <form onSubmit={handleAddArea}>
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
                  onClick={() => setIsAddAreaModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
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
const AreasList = ({ areas }) => {
  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-indigo-700">Áreas de Trabajo</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map(area => (
          <div key={area.id} className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
            <h3 className="font-bold text-lg text-indigo-800 mb-1">{area.name}</h3>
            <p className="text-gray-600">ID: {area.id}</p>
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

export default BossDashboard; 