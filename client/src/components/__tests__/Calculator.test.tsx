import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Calculator from "../Calculator";
import { pricingApi } from "../../services/api";

// Mock del pricingApi
jest.mock("../../services/api");

// Wrapper per Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe("Calculator Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders calculator form correctly", () => {
    render(
      <RouterWrapper>
        <Calculator />
      </RouterWrapper>
    );

    expect(screen.getByText("Calcolatrice Prezzi")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Inserisci un prezzo per calcolare l'altro automaticamente"
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Purchase Price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Retail Price/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Calcola/i })
    ).toBeInTheDocument();
  });

  it("displays current parameters", async () => {
    // Mock dei parametri
    const mockParams = {
      duty: 8,
      optimalMargin: 49,
      purchaseCurrency: "USD",
      sellingCurrency: "EUR",
    };

    (pricingApi.getParams as jest.Mock).mockResolvedValue(mockParams);

    render(
      <RouterWrapper>
        <Calculator />
      </RouterWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("8%")).toBeInTheDocument();
      expect(screen.getByText("49%")).toBeInTheDocument();
    });
  });

  it("calculates selling price when purchase price is entered", async () => {
    const user = userEvent.setup();
    const mockCalculation = {
      retailPrice: 129.9,
      purchasePrice: 21,
      margin: 0.489,
      purchaseCurrency: "USD",
      sellingCurrency: "EUR",
    };

    (pricingApi.calculateSellingPrice as jest.Mock).mockResolvedValue(
      mockCalculation
    );

    render(
      <RouterWrapper>
        <Calculator />
      </RouterWrapper>
    );

    const purchaseInput = screen.getByLabelText(/Purchase Price/i);
    const calculateButton = screen.getByRole("button", { name: /Calcola/i });

    await user.type(purchaseInput, "21");
    await user.click(calculateButton);

    await waitFor(() => {
      expect(pricingApi.calculateSellingPrice).toHaveBeenCalledWith(21, "USD");
    });
  });

  it("calculates purchase price when retail price is entered", async () => {
    const user = userEvent.setup();
    const mockCalculation = {
      purchasePrice: 21,
      retailPrice: 129.9,
      margin: 0.489,
      purchaseCurrency: "USD",
      sellingCurrency: "EUR",
    };

    (pricingApi.calculatePurchasePrice as jest.Mock).mockResolvedValue(
      mockCalculation
    );

    render(
      <RouterWrapper>
        <Calculator />
      </RouterWrapper>
    );

    const retailInput = screen.getByLabelText(/Retail Price/i);
    const calculateButton = screen.getByRole("button", { name: /Calcola/i });

    await user.type(retailInput, "129.9");
    await user.click(calculateButton);

    await waitFor(() => {
      expect(pricingApi.calculatePurchasePrice).toHaveBeenCalledWith(
        129.9,
        "EUR"
      );
    });
  });

  it("handles calculation errors gracefully", async () => {
    const user = userEvent.setup();
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    (pricingApi.calculateSellingPrice as jest.Mock).mockRejectedValue(
      new Error("Calculation failed")
    );

    render(
      <RouterWrapper>
        <Calculator />
      </RouterWrapper>
    );

    const purchaseInput = screen.getByLabelText(/Purchase Price/i);
    const calculateButton = screen.getByRole("button", { name: /Calcola/i });

    await user.type(purchaseInput, "21");
    await user.click(calculateButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Errore nel calcolo:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it("shows loading state during parameter loading", () => {
    (pricingApi.getParams as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    ); // Never resolves

    render(
      <RouterWrapper>
        <Calculator />
      </RouterWrapper>
    );

    expect(screen.getByText(/Caricamento parametri/i)).toBeInTheDocument();
  });
});
