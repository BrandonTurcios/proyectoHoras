// src/components/StudentSchedule.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Plus,
  Trash2
} from 'lucide-react';

const StudentSchedule = ({ studentId, onClose }) => {
  const [schedule, setSchedule] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const daysOfWeek = [
    'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'
  ];

  const timeSlots = Array.from({ length: 14 }, (_, i) => {
    const hour = i + 7; // Empezando desde las 7:00
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    fetchSchedule();
  }, [studentId]);

  const fetchSchedule = async () => {
    try {
      const { data, error } = await supabase
        .from('student_availability')
        .select('*')
        .eq('student_id', studentId);

      if (error) throw error;
      setSchedule(data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  };

  const handleAddTimeSlot = async (dayOfWeek, startTime, endTime) => {
    try {
      const { data, error } = await supabase
        .from('student_availability')
        .insert([
          {
            student_id: studentId,
            day_of_week: dayOfWeek,
            start_time: startTime,
            end_time: endTime
          }
        ]);

      if (error) throw error;
      fetchSchedule();
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding time slot:', error);
    }
  };

  const handleDeleteTimeSlot = async (id) => {
    try {
      const { error } = await supabase
        .from('student_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSchedule();
    } catch (error) {
      console.error('Error deleting time slot:', error);
    }
  };

  const getScheduleForDay = (day) => {
    return schedule.filter(slot => slot.day_of_week === day);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Mi Horario</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
              <span>Agregar Disponibilidad</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-700"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-4">
            {daysOfWeek.map(day => (
              <div key={day} className="text-center">
                <h3 className="font-medium text-gray-900 mb-4">{day}</h3>
                <div className="space-y-2">
                  {getScheduleForDay(day).map(slot => (
                    <div
                      key={slot.id}
                      className="bg-indigo-50 rounded-lg p-2 relative group"
                    >
                      <div className="text-sm text-indigo-700">
                        {slot.start_time} - {slot.end_time}
                      </div>
                      <button
                        onClick={() => handleDeleteTimeSlot(slot.id)}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-100 rounded-full p-1 text-red-600 hover:bg-red-200 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showAddForm && (
        <AddTimeSlotForm
          onSubmit={handleAddTimeSlot}
          onClose={() => setShowAddForm(false)}
          daysOfWeek={daysOfWeek}
        />
      )}
    </div>
  );
};

const AddTimeSlotForm = ({ onSubmit, onClose, daysOfWeek }) => {
  const [formData, setFormData] = useState({
    dayOfWeek: daysOfWeek[0],
    startTime: '07:00',
    endTime: '08:00'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData.dayOfWeek, formData.startTime, formData.endTime);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Agregar Disponibilidad</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Día de la semana
            </label>
            <select
              className="w-full border rounded-lg px-4 py-2"
              value={formData.dayOfWeek}
              onChange={e => setFormData({ ...formData, dayOfWeek: e.target.value })}
            >
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora inicio
              </label>
              <input
                type="time"
                className="w-full border rounded-lg px-4 py-2"
                value={formData.startTime}
                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora fin
              </label>
              <input
                type="time"
                className="w-full border rounded-lg px-4 py-2"
                value={formData.endTime}
                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSchedule;