import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

const WorkspacesManager = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (editingWorkspace) {
        const { error } = await supabase
          .from('workspaces')
          .update({ name: workspaceName })
          .eq('id', editingWorkspace.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workspaces')
          .insert([{ name: workspaceName }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingWorkspace(null);
      setWorkspaceName('');
      fetchWorkspaces();
    } catch (error) {
      console.error('Error saving workspace:', error);
      if (error.code === '23505') { // Unique violation
        setError('Ya existe un espacio de trabajo con ese nombre');
      } else {
        setError('Error al guardar el espacio de trabajo');
      }
    }
  };

  const handleEdit = (workspace) => {
    setEditingWorkspace(workspace);
    setWorkspaceName(workspace.name);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este espacio de trabajo?')) return;

    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchWorkspaces();
    } catch (error) {
      console.error('Error deleting workspace:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Espacios de Trabajo
        </h2>
        <button
          onClick={() => {
            setEditingWorkspace(null);
            setWorkspaceName('');
            setError(null);
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          <span>Nuevo Espacio</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map(workspace => (
          <div
            key={workspace.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {workspace.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(workspace)}
                  className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(workspace.id)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingWorkspace ? 'Editar Espacio' : 'Nuevo Espacio'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingWorkspace ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspacesManager; 