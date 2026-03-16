import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
}
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 rounded-full p-2 ${variant === "danger" ? "bg-red-100" : "bg-yellow-100"}`}
        >
          <AlertTriangle
            className={`h-5 w-5 ${variant === "danger" ? "text-red-600" : "text-yellow-600"}`}
          />
        </div>
        <p className="text-sm text-gray-600 pt-1">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors ${
            variant === "danger"
              ? "bg-red-600 hover:bg-red-500"
              : "bg-yellow-600 hover:bg-yellow-500"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
