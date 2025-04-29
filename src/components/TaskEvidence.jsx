// src/components/TaskEvidence.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Upload, 
  Image as ImageIcon,
  Trash2,
  Clock
} from 'lucide-react';

const TaskEvidence = ({ task, onClose }) => {
  const [description, setDescription] = useState('');
  const [hoursSpent, setHoursSpent] = useState(task.required_hours);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar tamaño y tipo de archivos
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB max
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Algunos archivos no son válidos. Use imágenes JPG o PNG de menos de 5MB.');
      return;
    }

    setImages([...images, ...validFiles]);
    setError(null);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError(null);

    try {
      // Subir imágenes
      const imageUrls = await Promise.all(
        images.map(async (image) => {
          const fileName = `${Date.now()}-${image.name}`;
          const { data, error } = await supabase.storage
            .from('task-evidences')
            .upload(fileName, image);

          if (error) {
            console.error("Error al subir la imagen:", error); // Detalles del error en la carga de la imagen
            throw error;
          }

          const { data: { publicUrl }, error: urlError } = supabase.storage
            .from('task-evidences')
            .getPublicUrl(fileName);

          if (urlError) {
            console.error("Error al obtener URL pública:", urlError); // Detalles del error al obtener la URL
            throw urlError;
          }

          return publicUrl;
        })
      );

      // Crear registro de evidencia
      const { data, error } = await supabase
        .from('evidences')
        .insert([{
          task_id: task.id,
          description,
          hours_spent: hoursSpent,
          images: imageUrls
        }]);

      if (error) {
        console.error("Error al insertar la evidencia:", error); // Detalles de error al insertar
        throw error;
      }

      // Actualizar estado de la tarea
      await supabase
        .from('tasks')
        .update({ status: 'submitted' })
        .eq('id', task.id);

      onClose();
    } catch (error) {
      setError('Error al subir la evidencia. Por favor, intente nuevamente.');
      console.error('Error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Subir Evidencia</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-medium mb-2">{task.title}</h3>
            <p className="text-gray-600 text-sm">{task.description}</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la actividad realizada
              </label>
              <textarea
                required
                rows="4"
                className="w-full border rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe las actividades realizadas..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas dedicadas
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  max={task.required_hours * 2}
                  required
                  className="w-24 border rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                />
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidencias (imágenes)
              </label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                      <span>Subir archivos</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageChange}
                      />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG hasta 5MB
                  </p>
                </div>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="h-24 w-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploading || images.length === 0}
                className={`px-4 py-2 rounded-lg text-white flex items-center ${
                  uploading || images.length === 0
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Enviar Evidencia
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskEvidence;
