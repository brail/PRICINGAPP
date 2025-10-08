import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingStates } from "../LoadingStates";

describe("LoadingStates Component - Simple Tests", () => {
  it("renders spinner by default", () => {
    render(<LoadingStates />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays custom message", () => {
    const customMessage = "Custom loading message";
    render(<LoadingStates message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("renders different types", () => {
    const { rerender } = render(<LoadingStates type="spinner" />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();

    rerender(<LoadingStates type="inline" message="Inline loading" />);
    expect(screen.getByText("Inline loading")).toBeInTheDocument();
  });
});
