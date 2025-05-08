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
      // Convert images to base64
      const imageBase64Promises = images.map(image => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(image);
        });
      });

      const imageBase64s = await Promise.all(imageBase64Promises);

      // Get student name from database
      let studentName = 'Sin asignar';
      if (task.student_id) {
        const { data: studentData, error: studentError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', task.student_id)
          .single();

        if (!studentError && studentData) {
          studentName = studentData.full_name;
        }
      }

      // Prepare the evidence data
      const evidenceData = {
        task_id: String(task.id), // string
        task_title: task.title,
        task_description: task.description,
        evidence_description: description,
        hours_spent: hoursSpent, // integer
        images: imageBase64s,
        student_name: studentName,
        due_date: String(task.due_date)
      };

      console.log('Task data:', task); // Para debug
      console.log('Evidence data:', evidenceData); // Para debug

      // Send the data to your Power Automate endpoint
      const response = await fetch('https://prod-148.westus.logic.azure.com:443/workflows/208cb434a6f149c0a7876ca39bd47d3a/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Itcc8LBKesxQFeqFwYRjsGDNuocdP4gCKmv66nyyNTU', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evidenceData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Error al enviar la evidencia: ${response.status} ${response.statusText}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Error al procesar la respuesta del servidor');
      }

      if (!result.pdfUrl) {
        console.error('Invalid response format:', result);
        throw new Error('La respuesta del servidor no contiene la URL del PDF');
      }
      
      // Update task status with the PDF link
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'submitted',
          evidence_pdf_url: result.pdfUrl // Store the PDF URL returned from Power Automate
        })
        .eq('id', task.id);

      if (error) {
        throw error;
      }

      onClose();
    } catch (error) {
      setError('Error al enviar la evidencia. Por favor, intente nuevamente.');
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
