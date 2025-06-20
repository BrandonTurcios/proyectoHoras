import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const StarRating = ({ value, onChange, name }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-center gap-1 justify-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange({ target: { name, value: star } })}
          className="focus:outline-none"
          aria-label={`Calificar con ${star} estrellas`}
        >
          <svg
            className={`w-7 h-7 ${value >= star ? 'text-yellow-400' : 'text-gray-300'}`}
            fill={value >= star ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l2.036 6.29a1 1 0 00.95.69h6.6c.969 0 1.371 1.24.588 1.81l-5.347 3.89a1 1 0 00-.364 1.118l2.036 6.29c.3.921-.755 1.688-1.54 1.118l-5.347-3.89a1 1 0 00-1.176 0l-5.347 3.89c-.784.57-1.838-.197-1.54-1.118l2.036-6.29a1 1 0 00-.364-1.118l-5.347-3.89c-.783-.57-.38-1.81.588-1.81h6.6a1 1 0 00.95-.69l2.036-6.29z" />
          </svg>
        </button>
      ))}
    </div>
    <div className="text-xs text-gray-500 mt-1">1 = Muy malo, 5 = Excelente</div>
  </div>
);

const SurveyModal = ({ isOpen, onClose }) => {
  const [answers, setAnswers] = useState({
    usage: 0,
    ease: 0,
    graphics: 0,
    comment: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleStarChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { usage, ease, graphics, comment } = answers;
    // Guardar en Supabase
    const { error } = await supabase
      .from('encuestas')
      .insert([{ usage, ease, graphics, comment }]);
    if (!error) {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setAnswers({ usage: 0, ease: 0, graphics: 0, comment: '' });
        onClose();
      }, 2000);
    } else {
      // Manejar error si lo deseas
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-xl font-bold text-indigo-700 dark:text-indigo-300 mb-4 text-center">Encuesta de Satisfacción</h2>
        {submitted ? (
          <div className="text-green-600 dark:text-green-400 text-center font-semibold py-8">
            ¡Gracias por tu opinión!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Uso de aplicación
              </label>
              <StarRating name="usage" value={answers.usage} onChange={handleStarChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Facilidad
              </label>
              <StarRating name="ease" value={answers.ease} onChange={handleStarChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Calidad gráfica
              </label>
              <StarRating name="graphics" value={answers.graphics} onChange={handleStarChange} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Comente si tuvo algún problema
              </label>
              <textarea
                name="comment"
                value={answers.comment}
                onChange={handleChange}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Describa su problema (opcional)"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
              disabled={answers.usage === 0 || answers.ease === 0 || answers.graphics === 0}
            >
              Enviar
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SurveyModal; 