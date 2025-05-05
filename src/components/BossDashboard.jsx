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
  Trash2
} from 'lucide-react';

// Áreas dummy
const AREAS = [
  { id: 'ingenieria', name: 'Ingeniería' },
  { id: 'ciencias', name: 'Ciencias' },
  { id: 'tecnologia', name: 'Tecnología' },
  { id: 'laboratorios', name: 'Laboratorios' }
];

const BossDashboard = () => {
  const [activeTab, setActiveTab] = useState('admins');
  const [admins, setAdmins] = useState([]);
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

  const { userData, signOut } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchAdmins();
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

  const renderContent = () => {
    switch (activeTab) {
      case 'admins':
        return <AdminsList admins={admins} areas={AREAS} onAssignArea={handleAssignArea} />;
      case 'areas':
        return <AreasList areas={AREAS} />;
      case 'statistics':
        return <Statistics admins={admins} areas={AREAS} />;
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
          <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-700 drop-shadow-sm">Panel de Jefe</h2>
          <p className="text-xs sm:text-sm text-indigo-500">Gestión de Áreas</p>
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
        </nav>

        {/* User Menu */}
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
                    {userData?.full_name || 'Jefe'}
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
              <h1 className="text-2xl font-extrabold text-indigo-700 drop-shadow-sm">Panel de Jefe</h1>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline-block text-indigo-500 font-semibold text-lg">{userData?.full_name || 'Jefe'}</span>
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
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAdmins.map(admin => (
          <div key={admin.id} className="bg-white rounded-xl p-6 shadow-md border border-indigo-100">
            <h3 className="font-bold text-lg text-indigo-800 mb-1">{admin.full_name}</h3>
            <p className="text-indigo-500 text-sm mb-4">{admin.email}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Área Asignada</label>
              <select
                value={admin.internship_area || ''}
                onChange={(e) => onAssignArea(admin.id, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

export default BossDashboard; 