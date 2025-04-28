// src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  ClipboardList, 
  BarChart2, 
  Calendar,
  Plus,
  Search,
  Filter
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userData } = useAuth();

  useEffect(() => {
    if (userData?.internship_area) {
      fetchStudents();
      fetchTasks();
    }
  }, [userData]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'student')
      .eq('internship_area', userData.internship_area);

    if (data) setStudents(data);
    setLoading(false);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        student:users(full_name),
        evidences(*)
      `)
      .eq('admin_id', userData.id);

    if (data) setTasks(data);
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
        return <Schedule students={students} tasks={tasks} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed w-64 h-full bg-white shadow-lg">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800">Panel de Control</h2>
          <p className="text-sm text-gray-600">{userData?.internship_area}</p>
        </div>
        <nav className="mt-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`w-full flex items-center p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'students' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <Users className="w-5 h-5 mr-3" />
            Estudiantes
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'tasks' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <ClipboardList className="w-5 h-5 mr-3" />
            Tareas
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`w-full flex items-center p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'statistics' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <BarChart2 className="w-5 h-5 mr-3" />
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`w-full flex items-center p-4 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 ${
              activeTab === 'schedule' ? 'bg-indigo-50 text-indigo-600' : ''
            }`}
          >
            <Calendar className="w-5 h-5 mr-3" />
            Horarios
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

// Componente de lista de estudiantes
const StudentsList = ({ students }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredStudents = students
    .filter(student => 
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.full_name.localeCompare(b.full_name);
      } else if (sortBy === 'hours') {
        return b.current_hours - a.current_hours;
      }
      return 0;
    });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Estudiantes</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar estudiante..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Ordenar por nombre</option>
            <option value="hours">Ordenar por horas</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map(student => (
          <div key={student.id} className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-lg mb-2">{student.full_name}</h3>
            <p className="text-gray-600 mb-2">{student.email}</p>
            <div className="mt-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Progreso de horas</span>
                <span className="text-sm font-medium">
                  {Math.round((student.current_hours / student.hours_required) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${(student.current_hours / student.hours_required) * 100}%` }}
                ></div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {student.current_hours} de {student.hours_required} horas completadas
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;