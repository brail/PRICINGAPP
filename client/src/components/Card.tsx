import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "outlined";
  padding?: "sm" | "md" | "lg" | "xl";
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  variant = "default",
  padding = "lg",
}) => {
  const baseClasses = "card";

  const variantClasses = {
    default: "card-default",
    elevated: "card-elevated",
    outlined: "card-outlined",
  };

  const paddingClasses = {
    sm: "card-padding-sm",
    md: "card-padding-md",
    lg: "card-padding-lg",
    xl: "card-padding-xl",
  };

  const combinedClasses = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={combinedClasses}>{children}</div>;
};

export default Card;
