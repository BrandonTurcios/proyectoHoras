// src/components/TasksManager.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

import { supabase } from '../lib/supabase';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  Image,
  ExternalLink,
  X,
  Briefcase
} from 'lucide-react';

const TasksManager = ({ tasks, students, onTaskUpdate }) => {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, approved
  const [selectedStudent, setSelectedStudent] = useState('all'); // all or student id
  const { userData } = useAuth();

  const isTaskOverdue = (dueDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    return today > taskDueDate;
  };

  const filteredTasks = tasks.filter(task => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (selectedStudent !== 'all' && task.student_id !== selectedStudent) return false;
    return true;
  });

  const handleCreateTask = async (taskData) => {
    const { student_ids, ...taskBaseData } = taskData;
    
    // Si no hay estudiantes seleccionados, crear una tarea sin asignar
    if (!student_ids || student_ids.length === 0) {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          ...taskBaseData,
          admin_id: userData.id,
        }])
        .select();

      if (error) {
        console.error("Error al crear tarea:", error);
        return;
      }
    } else {
      // Crear una tarea para cada estudiante seleccionado
      const tasksToCreate = student_ids.map(student_id => ({
        ...taskBaseData,
        student_id,
        admin_id: userData.id,
      }));

      const { data, error } = await supabase
        .from('tasks')
        .insert(tasksToCreate)
        .select();

      if (error) {
        console.error("Error al crear tareas:", error);
        return;
      }
    }

    onTaskUpdate();
    setShowNewTaskModal(false);
  };
  

  const handleApproveEvidence = async (taskId, evidenceId, hoursSpent) => {
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .update({ status: 'approved' })
      .eq('id', taskId)
      .select('student_id')
      .single();

    if (!taskError && task) {
      // Actualizar las horas del estudiante
      const { data: student, error: studentError } = await supabase
        .from('users')
        .select('current_hours')
        .eq('id', task.student_id)
        .single();

      if (!studentError) {
        await supabase
          .from('users')
          .update({ current_hours: student.current_hours + hoursSpent })
          .eq('id', task.student_id);
      }
    }

    setShowEvidenceModal(null);
    onTaskUpdate();
  };

  const handleRejectEvidence = async (taskId) => {
    await supabase
      .from('tasks')
      .update({ status: 'pending' })
      .eq('id', taskId);

    setShowEvidenceModal(null);
    onTaskUpdate();
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          admin:users!tasks_admin_id_fkey(full_name),
          student:users!tasks_student_id_fkey(full_name),
          workspace:workspaces(name),
          evidences(*)
        `)
        .eq('admin_id', userData.id);

      if (error) throw error;
      if (data) setTasks(data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <select
            className="border rounded-lg px-3 py-2 text-sm sm:text-base w-full sm:w-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="submitted">Enviadas</option>
            <option value="approved">Aprobadas</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm sm:text-base w-full sm:w-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
          >
            <option value="all">Todos los estudiantes</option>
            {students.map(student => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setShowNewTaskModal(true)}
          className="bg-indigo-600 text-white px-3 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700 text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <div className="text-gray-500">No hay tareas para mostrar.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map(task => (
            <div key={task.id} className="rounded-2xl p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-md hover:shadow-xl transition-shadow border border-indigo-100 dark:border-gray-700 flex flex-col h-full">
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
                    task.status === 'approved' ? 'bg-gradient-to-r from-green-400 to-green-600 text-white animate-pulse' :
                    task.status === 'submitted' ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white' :
                    'bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 dark:text-yellow-100'
                  }`} title={
                    task.status === 'approved' ? 'Aprobada' :
                    task.status === 'submitted' ? 'Enviada' : 'Pendiente'
                  }>
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
              <div className="space-y-2 text-xs sm:text-sm text-indigo-700 dark:text-indigo-400 mt-auto">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                  <span className="break-words">Entrega: {new Date(task.due_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                  <span className="break-words">{task.required_hours} horas requeridas</span>
                </div>
                
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                  <span className="break-words">
                    Asignado a: <span className="font-bold text-indigo-700 dark:text-indigo-400">{task.student?.full_name || 'Sin asignar'}</span>
                  </span>
                </div>
                {task.workspace && (
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
                    <span className="break-words">
                      Espacio: <span className="font-bold text-indigo-700 dark:text-indigo-400">{task.workspace.name}</span>
                    </span>
                  </div>
                )}
              </div>
              {(task.status === 'submitted' || task.status === 'approved') && (
                <button
                  onClick={() => setShowEvidenceModal(task)}
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

      {/* New Task Modal */}
      {showNewTaskModal && (
        <TaskForm
          students={students}
          onSubmit={handleCreateTask}
          onClose={() => setShowNewTaskModal(false)}
        />
      )}

      {/* Evidence Review Modal */}
      {showEvidenceModal && (
        <div className="fixed -inset-6 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 max-w-3xl w-full max-h-[100vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Revisión de Evidencia</h2>
              <button
                onClick={() => setShowEvidenceModal(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Descripción del estudiante:</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{showEvidenceModal.evidences?.[0]?.description || 'No hay descripción disponible'}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 mb-2">Horas dedicadas:</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  {/* Pill button: horas dedicadas */}
                  <button
                    type="button"
                    className={`flex items-center px-4 py-2 rounded-full border transition-colors font-semibold text-sm focus:outline-none
                      ${showEvidenceModal._horasOption === 'dedicadas'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow'
                        : 'bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-200 border-gray-300 dark:border-gray-600 hover:bg-indigo-50 dark:hover:bg-gray-800'}`}
                    onClick={() => setShowEvidenceModal({
                      ...showEvidenceModal,
                      _horasOption: 'dedicadas',
                      _adminHours: showEvidenceModal.evidences?.[0]?.hours_spent || showEvidenceModal.required_hours
                    })}
                  >
                    <span className="mr-2 w-3 h-3 rounded-full border-2 flex items-center justify-center
                      "
                      style={{
                        borderColor: showEvidenceModal._horasOption === 'dedicadas' ? '#6366f1' : '#cbd5e1',
                        background: showEvidenceModal._horasOption === 'dedicadas' ? '#6366f1' : 'transparent'
                      }}
                    >
                      {showEvidenceModal._horasOption === 'dedicadas' && <span className="block w-2 h-2 bg-white rounded-full"></span>}
                    </span>
                    Usar horas dedicadas por el alumno ({showEvidenceModal.evidences?.[0]?.hours_spent || showEvidenceModal.required_hours} horas)
                  </button>
                  {/* Pill button: horas requeridas */}
                  <button
                    type="button"
                    className={`flex items-center px-4 py-2 rounded-full border transition-colors font-semibold text-sm focus:outline-none
                      ${showEvidenceModal._horasOption === 'requeridas'
                        ? 'bg-green-600 text-white border-green-700 shadow'
                        : 'bg-white dark:bg-gray-700 text-green-700 dark:text-green-200 border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-gray-800'}`}
                    onClick={() => setShowEvidenceModal({
                      ...showEvidenceModal,
                      _horasOption: 'requeridas',
                      _adminHours: showEvidenceModal.required_hours
                    })}
                  >
                    <span className="mr-2 w-3 h-3 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: showEvidenceModal._horasOption === 'requeridas' ? '#22c55e' : '#cbd5e1',
                        background: showEvidenceModal._horasOption === 'requeridas' ? '#22c55e' : 'transparent'
                      }}
                    >
                      {showEvidenceModal._horasOption === 'requeridas' && <span className="block w-2 h-2 bg-white rounded-full"></span>}
                    </span>
                    Usar horas requeridas de la tarea ({showEvidenceModal.required_hours} horas)
                  </button>
                  {/* Pill button: otro */}
                  <button
                    type="button"
                    className={`flex items-center px-4 py-2 rounded-full border transition-colors font-semibold text-sm focus:outline-none
                      ${showEvidenceModal._horasOption === 'otro'
                        ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow'
                        : 'bg-white dark:bg-gray-700 text-yellow-700 dark:text-yellow-200 border-gray-300 dark:border-gray-600 hover:bg-yellow-50 dark:hover:bg-gray-800'}`}
                    onClick={() => setShowEvidenceModal({
                      ...showEvidenceModal,
                      _horasOption: 'otro',
                      _adminHours: showEvidenceModal._adminHours || showEvidenceModal.required_hours
                    })}
                  >
                    <span className="mr-2 w-3 h-3 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: showEvidenceModal._horasOption === 'otro' ? '#facc15' : '#cbd5e1',
                        background: showEvidenceModal._horasOption === 'otro' ? '#facc15' : 'transparent'
                      }}
                    >
                      {showEvidenceModal._horasOption === 'otro' && <span className="block w-2 h-2 bg-white rounded-full"></span>}
                    </span>
                    Otro:
                    <input
                      type="number"
                      min="1"
                      className={`ml-2 w-20 border rounded-lg px-2 py-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${showEvidenceModal._horasOption === 'otro' ? 'border-yellow-500' : 'border-gray-300 dark:border-gray-600'}`}
                      value={showEvidenceModal._adminHours !== undefined ? showEvidenceModal._adminHours : showEvidenceModal.required_hours}
                      onChange={e => setShowEvidenceModal({
                        ...showEvidenceModal,
                        _horasOption: 'otro',
                        _adminHours: Number(e.target.value)
                      })}
                      disabled={showEvidenceModal._horasOption !== 'otro'}
                    />
                    <span className="ml-1 text-yellow-900 dark:text-yellow-200 text-sm">horas</span>
                  </button>
                </div>
              </div>
              {/* Botones de acción y Ver PDF alineados a izquierda y derecha */}
              {(showEvidenceModal.status !== 'approved' || showEvidenceModal.evidence_pdf_url) && (
                <div className="flex flex-col sm:flex-row sm:items-end mt-4 sm:mt-6">
                  {showEvidenceModal.evidence_pdf_url && (
                    <div className="flex-1 flex justify-start mb-2 sm:mb-0">
                      <a
                        href={showEvidenceModal.evidence_pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base w-full sm:w-auto justify-center"
                      >
                        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                        Ver PDF
                      </a>
                    </div>
                  )}
                  {showEvidenceModal.status !== 'approved' && (
                    <div className="flex-1 flex justify-end space-x-2">
                      <button
                        onClick={() => handleRejectEvidence(showEvidenceModal.id)}
                        className="flex items-center justify-center px-4 py-2 border border-red-500 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 w-full sm:w-auto text-sm sm:text-base"
                      >
                        <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleApproveEvidence(
                          showEvidenceModal.id,
                          showEvidenceModal.evidences?.[0]?.id,
                          showEvidenceModal._adminHours !== undefined ? showEvidenceModal._adminHours : (showEvidenceModal.evidences?.[0]?.hours_spent || showEvidenceModal.required_hours)
                        )}
                        className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base"
                      >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                        Aprobar
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente del formulario de tareas
const TaskForm = ({ students, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    required_hours: 1,
    due_date: '',
    student_ids: [],
    workspace_id: '',
    status: 'pending'
  });
  const [workspaces, setWorkspaces] = useState([]);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setWorkspaces(data || []);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed -inset-6 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Nueva Tarea</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              type="text"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descripción
            </label>
            <textarea
              required
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Horas requeridas
              </label>
              <input
                type="number"
                min="1"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                value={formData.required_hours}
                onChange={(e) => setFormData({ ...formData, required_hours: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de entrega
              </label>
              <input
                type="date"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Espacio de trabajo
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={formData.workspace_id}
              onChange={(e) => setFormData({ ...formData, workspace_id: e.target.value })}
            >
              <option value="">Sin espacio de trabajo</option>
              {workspaces.map(workspace => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Asignar a estudiantes
            </label>
            <select
              multiple
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              value={formData.student_ids}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                setFormData({ ...formData, student_ids: selectedOptions });
              }}
              size="5"
            >
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Mantén presionado Ctrl (Cmd en Mac) para seleccionar múltiples estudiantes
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto text-sm sm:text-base text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full sm:w-auto text-sm sm:text-base"
            >
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TasksManager;