describe("Calculator E2E Tests", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should load the calculator page", () => {
    cy.contains("Calcolatrice Prezzi").should("be.visible");
    cy.contains(
      "Inserisci un prezzo per calcolare l'altro automaticamente"
    ).should("be.visible");
  });

  it("should display current parameters", () => {
    cy.get('[data-testid="duty-value"]').should("be.visible");
    cy.get('[data-testid="margin-value"]').should("be.visible");
    cy.get('[data-testid="purchase-currency"]').should("be.visible");
    cy.get('[data-testid="selling-currency"]').should("be.visible");
  });

  it("should calculate selling price from purchase price", () => {
    cy.get('input[name="purchasePrice"]').type("100");
    cy.get('button[type="submit"]').click();

    cy.get('input[name="retailPrice"]').should("have.value");
    cy.get('[data-testid="margin-result"]').should("be.visible");
  });

  it("should calculate purchase price from retail price", () => {
    cy.get('input[name="retailPrice"]').type("150");
    cy.get('button[type="submit"]').click();

    cy.get('input[name="purchasePrice"]').should("have.value");
    cy.get('[data-testid="margin-result"]').should("be.visible");
  });

  it("should handle currency selection", () => {
    cy.get('select[name="purchaseCurrency"]').select("EUR");
    cy.get('select[name="sellingCurrency"]').select("USD");

    cy.get('select[name="purchaseCurrency"]').should("have.value", "EUR");
    cy.get('select[name="sellingCurrency"]').should("have.value", "USD");
  });

  it("should show loading state during calculation", () => {
    cy.intercept("POST", "/api/calculate-selling", { delay: 1000 }).as(
      "calculateSelling"
    );

    cy.get('input[name="purchasePrice"]').type("100");
    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="loading-spinner"]').should("be.visible");
    cy.wait("@calculateSelling");
  });

  it("should display error message for invalid input", () => {
    cy.get('input[name="purchasePrice"]').type("-50");
    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="error-message"]').should("be.visible");
  });

  it("should clear all fields when clear button is clicked", () => {
    cy.get('input[name="purchasePrice"]').type("100");
    cy.get('input[name="retailPrice"]').type("150");

    cy.get('button[data-testid="clear-button"]').click();

    cy.get('input[name="purchasePrice"]').should("have.value", "");
    cy.get('input[name="retailPrice"]').should("have.value", "");
  });
});
