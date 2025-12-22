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
  Briefcase,
  List as ListIcon,
  LayoutGrid,
  Upload,
  Download,
  Save,
  AlertCircle,
  Trash2,
  Pencil
} from 'lucide-react';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const Notification = ({ type, message, onClose }) => {
  const isError = type === 'error';
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
      <div className={`rounded-lg shadow-lg p-4 flex items-center space-x-3 ${
        isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
      }`}>
        <div className={`flex-shrink-0 ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {isError ? <AlertCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${isError ? 'text-red-800' : 'text-green-800'}`}>
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded-full hover:bg-opacity-20 ${
            isError ? 'hover:bg-red-200' : 'hover:bg-green-200'
          }`}
        >
          <X className={`w-4 h-4 ${isError ? 'text-red-600' : 'text-green-600'}`} />
        </button>
      </div>
    </div>
  );
};

const TasksManager = ({ students, onTaskUpdate, areaId, tasks, handleChangeLimit }) => {
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState('all');
  const { userData } = useAuth();
  const [compactView, setCompactView] = useState(false); // Nueva vista
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewErrors, setPreviewErrors] = useState([]);
  const [notification, setNotification] = useState(null);
  const [showEditTaskModal, setShowEditTaskModal] = useState(null); // Para editar
  const [deleteTaskId, setDeleteTaskId] = useState(null); // Para modal de borrado

  useEffect(() => {
    let timer;
    if (notification) {
      timer = setTimeout(() => {
        setNotification(null);
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [notification]);

  const isTaskOverdue = (dueDate) => {
    const today = dayjs().startOf('day');
    const taskDueDate = dayjs(dueDate).startOf('day');
    return today.isAfter(taskDueDate);
  };

  const filteredTasks = (tasks || []).filter(task => {
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
        setNotification({ type: 'error', message: 'Error al crear la tarea: ' + error.message });
        return;
      }
      setNotification({ type: 'success', message: 'Tarea creada exitosamente' });
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
        setNotification({ type: 'error', message: 'Error al crear las tareas: ' + error.message });
        return;
      }
      setNotification({ type: 'success', message: 'Tareas creadas exitosamente' });
    }

    await onTaskUpdate();
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

    // Add success notification here
    setNotification({ type: 'success', message: 'Tarea aprobada exitosamente' });

    setShowEvidenceModal(null);
    await onTaskUpdate();
  };

  const handleRejectEvidence = async (taskId) => {
    await supabase
      .from('tasks')
      .update({ status: 'pending' })
      .eq('id', taskId);

    setNotification({ type: 'error', message: 'Evidencia rechazada. Tarea pendiente de nuevo.' });
    setShowEvidenceModal(null);
    await onTaskUpdate();
  };

  const validatePreviewData = async(data) => {
    const errors = [];
    data.forEach((row, index) => {
      if (!row.title?.trim()) {
        errors.push(`Fila ${index + 1}: El título es requerido`);
      }
      if (!row.description?.trim()) {
        errors.push(`Fila ${index + 1}: La descripción es requerida`);
      }
      if (!row.required_hours || isNaN(row.required_hours) || row.required_hours < 1) {
        errors.push(`Fila ${index + 1}: Las horas requeridas deben ser un número positivo`);
      }
      if (!row.due_date || !/^\d{4}-\d{2}-\d{2}$/.test(row.due_date)) {
        errors.push(`Fila ${index + 1}: La fecha debe estar en formato YYYY-MM-DD`);
      }
      if (row.student_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.student_email)) {
        errors.push(`Fila ${index + 1}: El email del estudiante no es válido`);
      }
    });
    setNotification({ type: 'success', message: 'Tarea actualizada exitosamente' });
    setShowEditTaskModal(null);
    await onTaskUpdate();
    document.body.style.overflow = 'auto';
    return errors;
  };

  const handleExcelImport = async(event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async(e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Convertir los datos al formato correcto
          const formattedData = jsonData.map((row) => {
            // Asegurar que la fecha esté en formato YYYY-MM-DD
            let dueDate = row.due_date;
            if (dueDate) {
              // Si la fecha viene como número de Excel, convertirla
              if (typeof dueDate === 'number') {
                const date = new Date((dueDate - 25569) * 86400 * 1000);
                dueDate = date.toISOString().split('T')[0];
              } else if (typeof dueDate === 'string') {
                // Si es string, asegurarse de que esté en formato YYYY-MM-DD
                const date = new Date(dueDate);
                if (!isNaN(date.getTime())) {
                  dueDate = date.toISOString().split('T')[0];
                }
              }
            }

            return {
              title: row.title || '',
              description: row.description || '',
              required_hours: row.required_hours ? parseInt(row.required_hours) : 1,
              due_date: dueDate || '',
              workspace_name: row.workspace_name || '',
              student_email: row.student_email || ''
            };
          });

          const errors = await validatePreviewData(formattedData);
          setPreviewErrors(errors);
          setPreviewData(formattedData);
          document.body.style.overflow = 'hidden';
          setImportPreview(true);
        } catch (error) {
          console.error('Error processing Excel file:', error);
          alert('Error al procesar el archivo Excel: ' + error.message);
        }
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        alert('Error al leer el archivo: ' + error.message);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error in file selection:', error);
      alert('Error al seleccionar el archivo: ' + error.message);
    } finally {
      event.target.value = null;
    }
  };

  const handlePreviewEdit = async(index, field, value) => {
    const newData = [...previewData];
    newData[index] = { ...newData[index], [field]: value };
    setPreviewData(newData);
    
    // Revalidar después de cada edición
    const errors = await validatePreviewData(newData);
    setPreviewErrors(errors);
  };

  const handleImportConfirm = async () => {
    if (previewErrors.length > 0) {
      alert('Por favor corrige los errores antes de importar');
      return;
    }

    setImporting(true);
    try {
      for (const row of previewData) {
        // Usar la fecha directamente del input, que ya está en formato YYYY-MM-DD
        const dueDate = row.due_date;

        let workspaceId = null;
        if (row.workspace_name) {
          const { data: existingWorkspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('name', row.workspace_name)
            .eq('area_id', areaId)
            .single();

          if (existingWorkspace) {
            workspaceId = existingWorkspace.id;
          } else {
            const { data: newWorkspace, error: workspaceError } = await supabase
              .from('workspaces')
              .insert([{
                name: row.workspace_name,
                area_id: areaId
              }])
              .select()
              .single();

            if (workspaceError) throw workspaceError;
            workspaceId = newWorkspace.id;
          }
        }

        const taskData = {
          title: row.title,
          description: row.description,
          required_hours: Number(row.required_hours) || 1,
          due_date: dueDate, // Usar la fecha directamente sin transformaciones
          workspace_id: workspaceId,
          status: 'pending',
          admin_id: userData.id
        };

        if (row.student_email) {
          const { data: student } = await supabase
            .from('users')
            .select('id')
            .eq('email', row.student_email)
            .single();

          if (student) {
            taskData.student_id = student.id;
          }
        }

        const { error: taskError } = await supabase
          .from('tasks')
          .insert([taskData]);

        if (taskError) throw taskError;
      }

      setImportPreview(false);
      await onTaskUpdate();
      setTimeout(() => {
        alert('Tareas importadas exitosamente');
      }, 100);
    } catch (error) {
      console.error('Error importing tasks:', error);
      alert('Error al importar las tareas: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = [
      {
        title: 'Título de la tarea',
        description: 'Descripción detallada de la tarea',
        required_hours: '2',
        due_date: '2024-03-20',
        workspace_name: 'Nombre del espacio de trabajo',
        student_email: 'email@estudiante.com'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, 'plantilla_tareas.xlsx');
  };

  const handleCloseNewTaskModal = () => {
    setShowNewTaskModal(false);
    document.body.style.overflow = 'auto';
  };

  const handleCloseEvidenceModal = () => {
    setShowEvidenceModal(null);
    document.body.style.overflow = 'auto';
  };

  const handleCloseImportPreview = () => {
    setImportPreview(false);
    document.body.style.overflow = 'auto';
  };

  // Editar tarea
  const handleEditTask = (task) => {
    setShowEditTaskModal(task);
    document.body.style.overflow = 'hidden';
  };

  // Guardar edición
  const handleUpdateTask = async (taskData) => {
    const { student_ids, ...taskBaseData } = taskData;
    // Solo permitimos editar una tarea a la vez (no masivo)
    const { error } = await supabase
      .from('tasks')
      .update({
        ...taskBaseData,
        student_id: student_ids && student_ids.length === 1 ? student_ids[0] : null,
      })
      .eq('id', showEditTaskModal.id);
    if (error) {
      setNotification({ type: 'error', message: 'Error al actualizar la tarea: ' + error.message });
      return;
    }
    setNotification({ type: 'success', message: 'Tarea actualizada exitosamente' });
    setShowEditTaskModal(null);
    await onTaskUpdate();
    document.body.style.overflow = 'auto';
  };

  // Borrar tarea
  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', deleteTaskId);
    if (error) {
      setNotification({ type: 'error', message: 'Error al borrar la tarea: ' + error.message });
    } else {
      setNotification({ type: 'error', message: 'Tarea eliminada exitosamente' });
    }
    setDeleteTaskId(null);
    await onTaskUpdate();
    document.body.style.overflow = 'auto';
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
      {/* Modal de confirmación de borrado */}
      {deleteTaskId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center mb-4">
              <Trash2 className="w-8 h-8 text-red-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Eliminar tarea</h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-6">¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => { setDeleteTaskId(null); document.body.style.overflow = 'auto'; }}
                className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTask}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal de edición */}
      {showEditTaskModal && (
        <TaskForm
          students={students}
          onSubmit={handleUpdateTask}
          onClose={() => { setShowEditTaskModal(null); document.body.style.overflow = 'auto'; }}
          areaId={areaId}
          initialData={showEditTaskModal}
        />
      )}
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto items-stretch">
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
            <button
              onClick={() => setCompactView(v => !v)}
              className="border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300 px-3 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-indigo-50 dark:hover:bg-gray-900 text-sm sm:text-base w-full sm:w-auto"
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
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={downloadTemplate}
              className="flex items-center justify-center w-full sm:w-auto px-3 py-2 sm:px-3 sm:py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg transition-colors text-sm gap-2"
            >
              <Download className="w-5 h-5" />
              <span>Descargar Plantilla</span>
            </button>
            <label className="flex items-center justify-center w-full sm:w-auto px-3 py-2 sm:px-3 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition-colors text-sm gap-2 cursor-pointer">
              <Upload className="w-5 h-5" />
              <span>{importing ? 'Importando...' : 'Importar Excel'}</span>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelImport}
                className="hidden"
                disabled={importing}
              />
            </label>
            <button
              onClick={() => {
                document.body.style.overflow = 'hidden';
                setShowNewTaskModal(true);
              }}
              className="flex items-center justify-center w-full sm:w-auto px-3 py-2 sm:px-3 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg transition-colors text-sm gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nueva Tarea</span>
            </button>
          </div>
        </div>
        <div className="flex w-full items-center gap-3 px-5 py-2">
          <label
            htmlFor="limit"
            className="font-semibold text-indigo-800 whitespace-nowrap"
          >
            Límite:
          </label>  
                      
          <select
            id="limit"
            className="
              w-full
              rounded-md
              bg-gradient-to-br from-indigo-50 to-white
              border border-indigo-200
              px-3 py-1.5
              text-sm
              shadow-sm
              transition-all
              hover:shadow-md
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-400
            "
            defaultValue={10}
            onChange={(e) => handleChangeLimit(Number(e.target.value))}
          >
            <option className="bg-indigo-50 text-indigo-900" value={25}>25</option>
            <option className="bg-indigo-50 text-indigo-900" value={50}>50</option>
            <option className="bg-indigo-50 text-indigo-900" value={100}>100</option>
            <option className="bg-indigo-50 text-indigo-900" value={500}>500</option>
          </select>
        </div>
        {/* Tasks Grid o Lista */}
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
                    <td className="px-3 py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold shadow-md max-w-full truncate ${
                        task.status === 'approved' ? 'bg-green-500 text-white' :
                        task.status === 'submitted' ? 'bg-blue-500 text-white' :
                        'bg-yellow-400 text-yellow-900 dark:text-yellow-100'
                      }`}>
                        {task.status === 'approved' ? 'Aprobada' :
                          task.status === 'submitted' ? 'Enviada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{dayjs(task.due_date).utc().format('YYYY-MM-DD')}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{task.required_hours}</td>
                    <td className="px-3 py-2 text-indigo-700 dark:text-indigo-300">{task.workspace?.name || 'Sin espacio'}</td>
                    <td className="px-3 py-2">
                      {(task.status === 'submitted' || task.status === 'approved') && (
                        <button
                          onClick={() => {
                            document.body.style.overflow = 'hidden';
                            setShowEvidenceModal({
                              ...task,
                              _horasOption: task.evidences?.[0]?.hours_spent !== undefined ? 'dedicadas' : 'requeridas',
                              _adminHours: task.evidences?.[0]?.hours_spent !== undefined ? task.evidences?.[0]?.hours_spent : task.required_hours
                            });
                          }}
                          className={`px-3 py-1 rounded-lg text-white text-xs font-semibold shadow transition-all ${
                            task.status === 'approved'
                              ? 'bg-green-600 hover:bg-green-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                        >
                          Ver Evidencia
                        </button>
                      )}
                      {task.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                            title="Editar tarea"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setDeleteTaskId(task.id); document.body.style.overflow = 'hidden'; }}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
                            title="Eliminar tarea"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                    <span className="break-words">Entrega: {dayjs(task.due_date).utc().format('YYYY-MM-DD')}</span>
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
                    onClick={() => {
                      document.body.style.overflow = 'hidden';
                      setShowEvidenceModal({
                        ...task,
                        _horasOption: task.evidences?.[0]?.hours_spent !== undefined ? 'dedicadas' : 'requeridas',
                        _adminHours: task.evidences?.[0]?.hours_spent !== undefined ? task.evidences?.[0]?.hours_spent : task.required_hours
                      });
                    }}
                    className={`mt-4 w-full px-4 py-2 rounded-xl text-white text-base font-semibold shadow-lg transition-all duration-150 ${
                      task.status === 'approved' 
                        ? 'bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'
                    }`}
                  >
                    Ver Evidencia
                  </button>
                )}
                {task.status === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEditTask(task)}
                      className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800 font-semibold"
                      title="Editar tarea"
                    >
                      <Pencil className="w-4 h-4 mr-1" /> Editar
                    </button>
                    <button
                      onClick={() => { setDeleteTaskId(task.id); document.body.style.overflow = 'hidden'; }}
                      className="flex-1 flex items-center justify-center px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 font-semibold"
                      title="Eliminar tarea"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                    </button>
                  </div>
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
            onClose={handleCloseNewTaskModal}
            areaId={areaId}
          />
        )}

        {/* Evidence Review Modal */}
        {showEvidenceModal && (
          <div 
            className="fixed -inset-6 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 sm:p-8 max-w-3xl w-full max-h-[100vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Revisión de Evidencia</h2>
                <button
                  onClick={handleCloseEvidenceModal}
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
                        _adminHours: showEvidenceModal._adminHours ?? showEvidenceModal.required_hours
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
                            showEvidenceModal._adminHours
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

        {/* Import Preview Modal */}
        {importPreview && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 max-w-[95vw] sm:max-w-2xl w-full max-h-[90vh] sm:max-h-[70vh] flex flex-col shadow-xl my-4">
              <div className="flex justify-between items-center mb-2 sm:mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Vista previa de importación
                </h2>
                <button
                  onClick={handleCloseImportPreview}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {previewErrors.length > 0 && (
                <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg overflow-y-auto max-h-[20vh] sm:max-h-[15vh]">
                  <div className="flex items-center text-red-700 dark:text-red-400 mb-1">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-semibold text-sm">Errores encontrados:</span>
                  </div>
                  <ul className="list-disc list-inside text-xs text-red-600 dark:text-red-400 space-y-0.5">
                    {previewErrors.map((error, index) => (
                      <li key={index} className="break-words">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-auto">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Título</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Descripción</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Horas</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Espacio</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">Email Estudiante</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {previewData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={row.title}
                              onChange={(e) => handlePreviewEdit(index, 'title', e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 min-w-[120px]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <textarea
                              value={row.description}
                              onChange={(e) => handlePreviewEdit(index, 'description', e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 min-w-[150px]"
                              rows="1"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="number"
                              min="1"
                              value={row.required_hours}
                              onChange={(e) => handlePreviewEdit(index, 'required_hours', e.target.value)}
                              className="w-16 border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="date"
                              value={row.due_date}
                              onChange={(e) => handlePreviewEdit(index, 'due_date', e.target.value)}
                              className="border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 min-w-[120px]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={row.workspace_name}
                              onChange={(e) => handlePreviewEdit(index, 'workspace_name', e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 min-w-[120px]"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="email"
                              value={row.student_email}
                              onChange={(e) => handlePreviewEdit(index, 'student_email', e.target.value)}
                              className="w-full border rounded px-1.5 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 min-w-[150px]"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCloseImportPreview}
                  className="px-3 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleImportConfirm}
                  disabled={previewErrors.length > 0 || importing}
                  className={`px-3 py-2 rounded-lg text-white flex items-center justify-center space-x-2 text-sm w-full sm:w-auto ${
                    previewErrors.length > 0 || importing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {importing ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Importando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Confirmar Importación</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// Componente del formulario de tareas
const TaskForm = ({ students, onSubmit, onClose, areaId, initialData }) => {
  const [formData, setFormData] = useState(() => initialData ? {
    title: initialData.title || '',
    description: initialData.description || '',
    required_hours: initialData.required_hours || 1,
    due_date: initialData.due_date ? initialData.due_date.slice(0, 10) : '',
    student_ids: initialData.student_id ? [initialData.student_id] : [],
    workspace_id: initialData.workspace_id || '',
    status: initialData.status || 'pending',
  } : {
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
    // Agregar overflow-hidden al body cuando el modal se abre
    document.body.style.overflow = 'hidden';
    
    // Limpiar el estilo cuando el componente se desmonta
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('area_id', areaId)
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

  const handleClose = () => {
    document.body.style.overflow = 'unset';
    onClose();
  };

  return (
    <div className="fixed -inset-6 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">{initialData ? 'Editar Tarea' : 'Nueva Tarea'}</h2>
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
              onClick={handleClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 w-full sm:w-auto text-sm sm:text-base text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full sm:w-auto text-sm sm:text-base"
            >
              {initialData ? 'Guardar Cambios' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TasksManager;