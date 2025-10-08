import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "white" | "muted";
  message?: string;
  fullScreen?: boolean;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "primary",
  message,
  fullScreen = false,
  className = "",
}) => {
  const sizeClasses = {
    sm: "spinner-sm",
    md: "spinner-md",
    lg: "spinner-lg",
    xl: "spinner-xl",
  };

  const colorClasses = {
    primary: "spinner-primary",
    secondary: "spinner-secondary",
    white: "spinner-white",
    muted: "spinner-muted",
  };

  const spinnerClasses = [
    "loading-spinner",
    sizeClasses[size],
    colorClasses[color],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <div className="loading-spinner-container">
      <div className={spinnerClasses}></div>
      {message && <div className="loading-spinner-message">{message}</div>}
    </div>
  );

  if (fullScreen) {
    return <div className="loading-spinner-fullscreen">{content}</div>;
  }

  return content;
};

export default LoadingSpinner;
