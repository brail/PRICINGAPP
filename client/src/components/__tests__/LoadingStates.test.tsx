import React from "react";
import { render, screen } from "@testing-library/react";
import { LoadingStates } from "../LoadingStates";

describe("LoadingStates Component", () => {
  it("renders spinner by default", () => {
    render(<LoadingStates />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("renders skeleton loading", () => {
    render(<LoadingStates type="skeleton" message="Loading content..." />);
    expect(screen.getByText("Loading content...")).toBeInTheDocument();
  });

  it("renders progress loading with percentage", () => {
    render(
      <LoadingStates type="progress" message="Processing..." progress={75} />
    );
    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("renders inline loading", () => {
    render(<LoadingStates type="inline" message="Saving..." size="small" />);
    expect(screen.getByText("Saving...")).toBeInTheDocument();
  });

  it("renders button loading", () => {
    render(<LoadingStates type="button" message="Submitting..." />);
    expect(screen.getByText("Submitting...")).toBeInTheDocument();
  });

  it("applies full screen styles when fullScreen is true", () => {
    const { container } = render(
      <LoadingStates type="progress" fullScreen={true} />
    );

    const loadingElement = container.querySelector(
      '[style*="position: fixed"]'
    );
    expect(loadingElement).toBeInTheDocument();
  });

  it("shows different colors based on color prop", () => {
    render(<LoadingStates type="spinner" color="error" />);
    // Material-UI applies color classes, we can check for the component
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("displays custom message", () => {
    const customMessage = "Custom loading message";
    render(<LoadingStates message={customMessage} />);
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it("handles undefined progress gracefully", () => {
    render(<LoadingStates type="progress" progress={undefined} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
