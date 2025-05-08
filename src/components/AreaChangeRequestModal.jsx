import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const AreaChangeRequestModal = ({ currentAreaId, areas, studentId, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentAreaName = areas.find(a => a.id === currentAreaId)?.name || 'Sin área';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await supabase.from('area_change_requests').insert([{
      student_id: studentId,
      current_area: currentAreaId,
      reason,
      status: 'pending'
    }]);
    setLoading(false);
    setSuccess(true);
  };

  const handleClose = () => {
    setSuccess(false);
    onClose();
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-0 sm:p-0">
      <div className="p-6 border-b border-gray-200 flex items-center">
        <h2 className="text-xl font-semibold text-indigo-800">Solicitar cambio de área</h2>
      </div>
      <div className="p-6">
        {success ? (
          <div className="text-green-600 mb-4 flex flex-col items-center gap-4">
            ¡Solicitud enviada!
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full sm:w-auto"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Área actual</label>
              <input
                type="text"
                value={currentAreaName}
                disabled
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Razón</label>
              <textarea
                required
                className="w-full border rounded-lg px-3 py-2"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 w-full sm:w-auto"
              >
                {loading ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AreaChangeRequestModal; 