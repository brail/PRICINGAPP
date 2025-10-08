import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ParameterProvider, useParameterManager } from "../ParameterContext";
import { pricingApi } from "../../services/api";

// Mock del pricingApi
jest.mock("../../services/api");

// Test component che usa il context
const TestComponent = () => {
  const { currentParams, parameterSets, loading, loadParameterSet } =
    useParameterManager();

  return (
    <div>
      <div data-testid="loading">{loading ? "Loading" : "Not Loading"}</div>
      <div data-testid="params-count">{parameterSets.length}</div>
      <div data-testid="current-duty">{currentParams?.duty}</div>
      <button onClick={() => loadParameterSet(1)}>Load Set 1</button>
    </div>
  );
};

describe("ParameterContext", () => {
  const mockParameterSets = [
    {
      id: 1,
      description: "Default Set",
      duty: 8,
      optimalMargin: 49,
      purchaseCurrency: "USD",
      sellingCurrency: "EUR",
    },
  ];

  const mockCurrentParams = {
    duty: 8,
    optimalMargin: 49,
    purchaseCurrency: "USD",
    sellingCurrency: "EUR",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (pricingApi.getParameterSets as jest.Mock).mockResolvedValue(
      mockParameterSets
    );
    (pricingApi.getParams as jest.Mock).mockResolvedValue(mockCurrentParams);
    (pricingApi.loadParameterSet as jest.Mock).mockResolvedValue(
      mockCurrentParams
    );
  });

  it("provides parameter sets and current params", async () => {
    render(
      <ParameterProvider>
        <TestComponent />
      </ParameterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("params-count")).toHaveTextContent("1");
      expect(screen.getByTestId("current-duty")).toHaveTextContent("8");
    });
  });

  it("handles loading state correctly", async () => {
    (pricingApi.getParameterSets as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    render(
      <ParameterProvider>
        <TestComponent />
      </ParameterProvider>
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("Loading");
  });

  it("loads parameter set when loadParameterSet is called", async () => {
    render(
      <ParameterProvider>
        <TestComponent />
      </ParameterProvider>
    );

    await waitFor(() => {
      const loadButton = screen.getByText("Load Set 1");
      act(() => {
        loadButton.click();
      });
    });

    await waitFor(() => {
      expect(pricingApi.loadParameterSet).toHaveBeenCalledWith(1);
    });
  });

  it("handles errors gracefully", async () => {
    (pricingApi.getParameterSets as jest.Mock).mockRejectedValue(
      new Error("Failed to load")
    );

    render(
      <ParameterProvider>
        <TestComponent />
      </ParameterProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("params-count")).toHaveTextContent("0");
    });
  });
});
