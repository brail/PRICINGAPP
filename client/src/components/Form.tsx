import React from "react";

interface FormProps {
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
}

interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

interface FormLabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  error?: boolean;
}

interface FormTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
  error?: boolean;
}

const Form: React.FC<FormProps> = ({ children, onSubmit, className = "" }) => {
  return (
    <form onSubmit={onSubmit} className={`form ${className}`}>
      {children}
    </form>
  );
};

const FormGroup: React.FC<FormGroupProps> = ({ children, className = "" }) => {
  return <div className={`form-group ${className}`}>{children}</div>;
};

const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  required = false,
  className = "",
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className={`form-label ${required ? "required" : ""} ${className}`}
    >
      {children}
      {required && <span className="required-asterisk"> *</span>}
    </label>
  );
};

const FormInput: React.FC<FormInputProps> = ({
  className = "",
  error = false,
  ...props
}) => {
  const errorClass = error ? "form-input-error" : "";
  return (
    <input className={`form-input ${errorClass} ${className}`} {...props} />
  );
};

const FormTextArea: React.FC<FormTextAreaProps> = ({
  className = "",
  error = false,
  ...props
}) => {
  const errorClass = error ? "form-input-error" : "";
  return (
    <textarea
      className={`form-textarea ${errorClass} ${className}`}
      {...props}
    />
  );
};

export { Form, FormGroup, FormLabel, FormInput, FormTextArea };
