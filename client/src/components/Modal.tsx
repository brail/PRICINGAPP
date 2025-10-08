import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "centered" | "fullscreen";
  className?: string;
}

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  variant = "default",
  className = "",
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "modal-sm",
    md: "modal-md",
    lg: "modal-lg",
    xl: "modal-xl",
  };

  const variantClasses = {
    default: "modal-default",
    centered: "modal-centered",
    fullscreen: "modal-fullscreen",
  };

  const modalClasses = [
    "modal",
    sizeClasses[size],
    variantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={modalClasses} onClick={(e) => e.stopPropagation()}>
        {title && <ModalHeader onClose={onClose}>{title}</ModalHeader>}
        {children}
      </div>
    </div>
  );
};

const ModalHeader: React.FC<ModalHeaderProps> = ({
  children,
  onClose,
  className = "",
}) => {
  return (
    <div className={`modal-header ${className}`}>
      <h3 className="modal-title">{children}</h3>
      {onClose && (
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Chiudi"
        >
          ×
        </button>
      )}
    </div>
  );
};

const ModalBody: React.FC<ModalBodyProps> = ({ children, className = "" }) => {
  return <div className={`modal-body ${className}`}>{children}</div>;
};

const ModalFooter: React.FC<ModalFooterProps> = ({
  children,
  className = "",
}) => {
  return <div className={`modal-footer ${className}`}>{children}</div>;
};

export { Modal, ModalHeader, ModalBody, ModalFooter };
