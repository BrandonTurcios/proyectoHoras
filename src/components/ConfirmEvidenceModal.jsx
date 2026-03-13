import { X } from "lucide-react";
import { useState } from "react";

export default function ConfirmEvidenceModal({
  open,
  type,
  onClose,
  onConfirm,
}) {
  const [description, setDescription] = useState("");

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(description);
    setDescription("");
  };

  const handleClose = () => {
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md shadow-lg">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {type === "approve" ? "Aprobar evidencia" : "Rechazar evidencia"}
          </h2>
          <button onClick={handleClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {type === "approve"
            ? "¿Seguro que deseas aprobar esta evidencia?"
            : "¿Seguro que deseas rechazar esta evidencia?"}
        </p>

        {/* Campo de descripción */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Descripción
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              type === "approve"
                ? "Comentario opcional..."
                : "Motivo del rechazo..."
            }
            className="w-full border rounded-lg p-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 border rounded-lg"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-white ${
              type === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}
