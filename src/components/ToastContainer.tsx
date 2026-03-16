import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import type { Toast } from "../types";
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}
const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};
const colors = {
  success: "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-success)_10%,white)] text-[var(--color-success)]",
  error: "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-danger)_10%,white)] text-[var(--color-danger)]",
  info: "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-info)_10%,white)] text-[var(--color-info)]",
  warning: "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-warning)_10%,white)] text-[var(--color-warning)]",
};
const iconColors = {
  success: "text-green-500",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-yellow-500",
};
export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        return (
          <div
            key={toast.id}
            className={`panel flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg animate-rise ${colors[toast.type]}`}
          >
            <Icon
              className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColors[toast.type]}`}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{toast.title}</p>
              {toast.message && (
                <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
