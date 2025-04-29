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
  ExternalLink
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-x-4">
          <select
            className="border rounded-lg px-4 py-2"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="submitted">Enviadas</option>
            <option value="approved">Aprobadas</option>
          </select>
          <select
            className="border rounded-lg px-4 py-2"
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
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => (
          <div key={task.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">{task.title}</h3>
              <span className={`px-2 py-1 rounded-full text-sm ${
                task.status === 'approved' ? 'bg-green-100 text-green-800' :
                task.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {task.status === 'approved' ? 'Aprobada' :
                 task.status === 'submitted' ? 'Enviada' : 'Pendiente'}
              </span>
            </div>
            <p className="text-gray-600 mb-4">{task.description}</p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Entrega: {new Date(task.due_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                <span>{task.required_hours} horas requeridas</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2" />
                <span>Asignado a: {task.student?.full_name || 'Sin asignar'}</span>
              </div>
            </div>
            
            {task.status === 'submitted' && (
              <button
                onClick={() => setShowEvidenceModal(task)}
                className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold mb-4">Revisión de Evidencia</h2>
            {showEvidenceModal.evidences?.[0] && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Descripción del estudiante:</h3>
                  <p className="text-gray-600">{showEvidenceModal.evidences[0].description}</p>
                </div>
                <div>
                  <h3 className="font-medium">Horas dedicadas:</h3>
                  <p className="text-gray-600">{showEvidenceModal.evidences[0].hours_spent} horas</p>
                </div>
                <div>
                  <h3 className="font-medium">Evidencias:</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {showEvidenceModal.evidences[0].images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <a
                          href={image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="w-6 h-6 text-white" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => handleRejectEvidence(showEvidenceModal.id)}
                    className="flex items-center px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleApproveEvidence(
                      showEvidenceModal.id,
                      showEvidenceModal.evidences[0].id,
                      showEvidenceModal.evidences[0].hours_spent
                    )}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Aprobar
                  </button>
                </div>
              </div>
            )}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4">Nueva Tarea</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              required
              className="w-full border rounded-lg px-4 py-2"
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
              className="w-full border rounded-lg px-4 py-2"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Espacio
              </label>
              <select
                className="w-full border rounded-lg px-4 py-2"
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
                className="w-full border rounded-lg px-4 py-2"
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
              className="w-full border rounded-lg px-4 py-2"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asignar a estudiante (opcional)
            </label>
            <select
              className="w-full border rounded-lg px-4 py-2"
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
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
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