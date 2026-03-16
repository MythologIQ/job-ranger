import { ReactNode } from "react";

interface BadgeProps {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
}

export const Badge = ({
  variant = "neutral",
  size = "md",
  children,
  className = "",
}: BadgeProps) => {
  const variantClasses = {
    success: "bg-green-50 text-green-700 ring-green-600/20",
    warning: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    error: "bg-red-50 text-red-700 ring-red-600/20",
    info: "bg-blue-50 text-blue-700 ring-blue-600/20",
    neutral: "bg-gray-50 text-gray-600 ring-gray-500/10",
  }[variant];

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1 text-base",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md ring-1 ring-inset font-medium ${variantClasses} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
