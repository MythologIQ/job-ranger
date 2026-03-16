import { ReactNode } from "react";

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  className?: string;
}

export const LoadingOverlay = ({
  isLoading,
  children,
  message = "Loading...",
  className = "",
}: LoadingOverlayProps) => {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <svg
              className="h-8 w-8 animate-spin text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-2.209-.84-4.208-2.209-5.828.529-1.621 1.619-3.021 3.021-5.828 1.621 0 3.021-.84 5.828-2.209 1.621 0 3.021-1.619 5.828-3.021z"
              />
            </svg>
            <p className="text-sm font-medium text-gray-700">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
