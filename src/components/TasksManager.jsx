// src/components/TasksManager.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // o donde tengas tu AuthContext

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
  X
} from 'lucide-react';

const TasksManager = ({ tasks, students, onTaskUpdate }) => {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, approved
  const [selectedSpace, setSelectedSpace] = useState('all'); // all, labs, general
  const { userData } = useAuth();

  const spaces = [
    { id: 'all', name: 'Todos los espacios' },
    { id: 'labs', name: 'Laboratorios' },
    { id: 'general', name: 'General' }
  ];

  const filteredTasks = tasks.filter(task => {
    if (filter !== 'all' && task.status !== filter) return false;
    if (selectedSpace !== 'all' && task.space !== selectedSpace) return false;
    return true;
  });

  const handleCreateTask = async (taskData) => {
    const completeTaskData = {
      ...taskData,
      admin_id: userData.id,
    };
  
    const { data, error } = await supabase
      .from('tasks')
      .insert([completeTaskData])
      .select();
  
    if (error) {
      console.error("Error al crear tarea:", error);
      return;
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
          <select
            className="border rounded-lg px-3 py-2 text-sm sm:text-base w-full sm:w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="submitted">Enviadas</option>
            <option value="approved">Aprobadas</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm sm:text-base w-full sm:w-auto"
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value)}
          >
            {spaces.map(space => (
              <option key={space.id} value={space.id}>
                {space.name}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <h3 className="font-semibold text-base sm:text-lg">{task.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs sm:text-sm ${
                task.status === 'approved' ? 'bg-green-100 text-green-800' :
                task.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {task.status === 'approved' ? 'Aprobada' :
                 task.status === 'submitted' ? 'Enviada' : 'Pendiente'}
              </span>
            </div>
            <p className="text-gray-600 text-sm sm:text-base mb-3 sm:mb-4">{task.description}</p>
            <div className="space-y-2 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span>Entrega: {new Date(task.due_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span>{task.required_hours} horas requeridas</span>
              </div>
              <div className="flex items-center">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span>Asignado a: {task.student?.full_name || 'Sin asignar'}</span>
              </div>
            </div>
            
            {task.status === 'submitted' && (
              <button
                onClick={() => setShowEvidenceModal(task)}
                className="mt-3 sm:mt-4 w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Ver Evidencia
              </button>
            )}
          </div>
        ))}
      </div>

      {/* New Task Modal */}
      {showNewTaskModal && (
        <TaskForm
          students={students}
          spaces={spaces}
          onSubmit={handleCreateTask}
          onClose={() => setShowNewTaskModal(false)}
        />
      )}

      {/* Evidence Review Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold">Revisión de Evidencia</h2>
              <button
                onClick={() => setShowEvidenceModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm sm:text-base">Descripción del estudiante:</h3>
                <p className="text-gray-600 text-sm sm:text-base">{showEvidenceModal.evidences?.[0]?.description || 'No hay descripción disponible'}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm sm:text-base">Horas dedicadas:</h3>
                <p className="text-gray-600 text-sm sm:text-base">{showEvidenceModal.evidences?.[0]?.hours_spent || showEvidenceModal.required_hours} horas</p>
              </div>
              {showEvidenceModal.evidence_pdf_url && (
                <a
                  href={showEvidenceModal.evidence_pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm sm:text-base"
                >
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Ver PDF
                </a>
              )}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-6">
                <button
                  onClick={() => handleRejectEvidence(showEvidenceModal.id)}
                  className="flex items-center justify-center px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 w-full sm:w-auto text-sm sm:text-base"
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Rechazar
                </button>
                <button
                  onClick={() => handleApproveEvidence(
                    showEvidenceModal.id,
                    showEvidenceModal.evidences?.[0]?.id,
                    showEvidenceModal.evidences?.[0]?.hours_spent || showEvidenceModal.required_hours
                  )}
                  className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full sm:w-auto text-sm sm:text-base"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente del formulario de tareas
const TaskForm = ({ students, spaces, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    space: 'general',
    required_hours: 1,
    due_date: '',
    student_id: '',
    status: 'pending'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Nueva Tarea</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              required
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Espacio
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base"
                value={formData.space}
                onChange={(e) => setFormData({ ...formData, space: e.target.value })}
              >
                {spaces.filter(space => space.id !== 'all').map(space => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas requeridas
              </label>
              <input
                type="number"
                min="1"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base"
                value={formData.required_hours}
                onChange={(e) => setFormData({ ...formData, required_hours: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de entrega
            </label>
            <input
              type="date"
              required
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asignar a estudiante (opcional)
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm sm:text-base"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
            >
              <option value="">Sin asignar</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 w-full sm:w-auto text-sm sm:text-base"
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