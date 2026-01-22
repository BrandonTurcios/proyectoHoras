import { useState, useEffect } from "react";
import { supabase } from "./../../lib/supabase";

export default function ModalChangeArea({ userId, isOpen, onClose, onUpdate }) {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchAreas = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("areas")
        .select("id, name");

      if (!error) setAreas(data);
      setLoading(false);
    };

    fetchAreas();
  }, [isOpen]);

  const handleSave = async () => {
    if (!selectedArea) return;

    await supabase
      .from("users")
      .update({ internship_area: selectedArea })
      .eq("id", userId);
    onUpdate();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50"
      onClick={onClose}
    >
      {/* MODAL */}
      <div
        className=" bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-indigo-800">
            Cambiar de Área
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        {loading ? (
          <p className="text-sm text-gray-500">Cargando áreas...</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-auto">
            {areas.map((area) => (
              <label
                key={area.id}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer border
                  ${
                    selectedArea === area.id
                      ? "bg-indigo-50 border-indigo-400"
                      : "hover:bg-indigo-400"
                  }`}
              >
                <input
                  type="radio"
                  name="area"
                  value={area.id}
                  onChange={() => setSelectedArea(area.id)}
                />
                <span>{area.name}</span>
              </label>
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border hover:bg-indigo-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedArea}
            className="px-4 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
