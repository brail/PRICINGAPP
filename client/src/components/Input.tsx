import React from "react";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  error?: boolean;
  helperText?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  variant?: "default" | "outlined" | "filled";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error = false,
  helperText,
  startIcon,
  endIcon,
  variant = "default",
  size = "md",
  className = "",
  ...props
}) => {
  const baseClasses = "input-base";

  const variantClasses = {
    default: "input-default",
    outlined: "input-outlined",
    filled: "input-filled",
  };

  const sizeClasses = {
    sm: "input-sm",
    md: "input-md",
    lg: "input-lg",
  };

  const errorClass = error ? "input-error" : "";

  const inputClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    errorClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="input-wrapper">
      {label && (
        <label className="input-label">
          {label}
          {props.required && <span className="required-asterisk"> *</span>}
        </label>
      )}

      <div className="input-container">
        {startIcon && <div className="input-start-icon">{startIcon}</div>}

        <input className={inputClasses} {...props} />

        {endIcon && <div className="input-end-icon">{endIcon}</div>}
      </div>

      {helperText && (
        <div className={`input-helper-text ${error ? "error" : ""}`}>
          {helperText}
        </div>
      )}
    </div>
  );
};

export default Input;
