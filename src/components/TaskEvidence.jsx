// src/components/TaskEvidence.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Upload, 
  Image as ImageIcon,
  Trash2,
  Clock,
  Briefcase
} from 'lucide-react';

// Add compression function
const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        const maxWidth = 1200;
        const maxHeight = 1200;
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        
        if (ratio < 1) {
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Draw image with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 with compression
        const quality = 0.7; // Adjust quality (0.1 to 1)
        const base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Convert base64 to Blob
        const byteString = atob(base64.split(',')[1]);
        const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        
        const blob = new Blob([ab], { type: mimeString });
        resolve(blob);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const TaskEvidence = ({ task, onClose }) => {
  const [description, setDescription] = useState('');
  const [hoursSpent, setHoursSpent] = useState(task.required_hours);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Obtener el nombre del workspace desde la prop task
  const workspaceName = task.workspaces?.name || 'Sin espacio de trabajo';

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
      // Compress all images
      const compressedImages = await Promise.all(images.map(compressImage));
      
      // Convert compressed images to base64
      const imageBase64Promises = compressedImages.map(image => {
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

      // Insert evidence into the evidences table
      const { error: evidenceError } = await supabase
        .from('evidences')
        .insert([
          {
            task_id: task.id,
            student_id: task.student_id,
            description: description,
            hours_spent: hoursSpent,
            submitted_at: new Date().toISOString(),
          }
        ]);
      if (evidenceError) throw evidenceError;

      // Prepare the evidence data for Power Automate
      const evidenceData = {
        task_id: String(task.id),
        task_title: task.title,
        task_description: task.description,
        evidence_description: description,
        hours_spent: hoursSpent,
        images: imageBase64s,
        student_name: studentName,
        workspace_name: workspaceName,
        due_date: String(task.due_date)
      };

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
          evidence_pdf_url: result.pdfUrl
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
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="max-w-3xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold dark:text-white">Subir Evidencia</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex flex-col h-full" style={{ flex: 1, minHeight: '0' }}>
          <div className="mb-6 max-h-40 overflow-y-auto">
            <div className="relative group">
              <h3 className="font-medium mb-2 dark:text-white truncate" title={task.title}>
                {task.title}
              </h3>
              {/* Tooltip for long titles */}
              <div className="hidden group-hover:block absolute left-0 top-full z-10 mt-1 w-max max-w-xs bg-indigo-900 dark:bg-indigo-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg whitespace-pre-line break-words">
                {task.title}
              </div>
            </div>
            <div className="relative group">
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3" title={task.description}>
                {task.description}
              </p>
              {/* Tooltip for long descriptions */}
              <div className="hidden group-hover:block absolute left-0 top-full z-10 mt-1 w-max max-w-xs bg-indigo-900 dark:bg-indigo-800 text-white text-sm rounded-lg px-3 py-2 shadow-lg whitespace-pre-line break-words">
                {task.description}
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col justify-end">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horas dedicadas
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max={task.required_hours * 2}
                    required
                    className="w-24 border rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(Number(e.target.value))}
                  />
                  <Clock className="w-5 h-5 text-gray-400 dark:text-gray-300" />
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Espacio de trabajo
                </label>
                <div className="flex items-center space-x-2">
                  <Briefcase className="w-5 h-5 text-indigo-400 dark:text-indigo-300" />
                  <span className="font-semibold text-indigo-700 dark:text-indigo-200">{workspaceName}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción de la actividad realizada
              </label>
              <textarea
                required
                rows="4"
                className="w-full border rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe las actividades realizadas..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Evidencias (imágenes)
              </label>
              <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" />
                  <div className="flex text-sm text-gray-600 dark:text-gray-300">
                    <label className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
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
                      className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 dark:bg-red-900 rounded-full p-1 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end space-x-4 mt-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={uploading || images.length === 0}
                className={`px-4 py-2 rounded-lg text-white flex items-center ${
                  uploading || images.length === 0
                    ? 'bg-indigo-400 dark:bg-indigo-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
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