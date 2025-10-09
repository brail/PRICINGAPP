import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
  component?: React.ElementType;
  to?: string;
}

const CustomButton: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  component: Component = "button",
  to,
  ...props
}) => {
  const baseClasses = "btn-base";

  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    success: "btn-success",
    danger: "btn-danger",
    warning: "btn-warning",
    info: "btn-info",
    outline: "btn-outline",
  };

  const sizeClasses = {
    sm: "btn-sm",
    md: "btn-md",
    lg: "btn-lg",
  };

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const componentProps = {
    className: combinedClasses,
    ...(to && { to }),
    ...props,
  };

  return <Component {...componentProps}>{children}</Component>;
};

export default CustomButton;
