import React from "react";
import { BusinessError } from "./CompactErrorHandler";
import CompactErrorHandler from "./CompactErrorHandler";

interface ErrorListHandlerProps {
  errors: BusinessError[];
  onDismiss?: (id: string) => void;
  onRetry?: () => void;
}

const ErrorListHandler: React.FC<ErrorListHandlerProps> = ({
  errors,
  onDismiss,
  onRetry,
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <>
      {errors.map((error) => (
        <CompactErrorHandler
          key={error.id}
          error={error}
          onDismiss={onDismiss}
          onRetry={onRetry}
        />
      ))}
    </>
  );
};

export default ErrorListHandler;
