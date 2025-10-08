import React from "react";
import logoBlack from "../assets/images/logo_black.svg";
import logoWhite from "../assets/images/logo_white.svg";
import "./Logo.css";

interface LogoProps {
  variant?: "black" | "white";
  size?: "small" | "medium" | "large";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  variant = "black",
  size = "medium",
  className = "",
}) => {
  const logoSrc = variant === "white" ? logoWhite : logoBlack;

  return (
    <img
      src={logoSrc}
      alt="Pricing Calculator"
      className={`logo logo-${size} ${className}`}
    />
  );
};

export default Logo;
