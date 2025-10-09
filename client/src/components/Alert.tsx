import React from "react";
import CustomButton from "./CustomButton";

interface AlertProps {
  children: React.ReactNode;
  severity?: "success" | "error" | "warning" | "info";
  variant?: "filled" | "outlined" | "text";
  size?: "sm" | "md" | "lg";
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  children,
  severity = "info",
  variant = "outlined",
  size = "md",
  dismissible = false,
  onDismiss,
  className = "",
}) => {
  const severityClasses = {
    success: "alert-success",
    error: "alert-error",
    warning: "alert-warning",
    info: "alert-info",
  };

  const variantClasses = {
    filled: "alert-filled",
    outlined: "alert-outlined",
    text: "alert-text",
  };

  const sizeClasses = {
    sm: "alert-sm",
    md: "alert-md",
    lg: "alert-lg",
  };

  const alertClasses = [
    "alert",
    severityClasses[severity],
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={alertClasses} role="alert">
      <div className="alert-content">{children}</div>
      {dismissible && onDismiss && (
        <CustomButton
          variant="outline"
          size="sm"
          onClick={onDismiss}
          aria-label="Chiudi"
        >
          ×
        </CustomButton>
      )}
    </div>
  );
};

export default Alert;
