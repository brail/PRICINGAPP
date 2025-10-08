describe("Parameters E2E Tests", () => {
  beforeEach(() => {
    cy.visit("/parameters");
  });

  it("should load the parameters page", () => {
    cy.contains("Gestione Parametri").should("be.visible");
  });

  it("should display parameter sets list", () => {
    cy.get('[data-testid="parameter-sets-list"]').should("be.visible");
    cy.get('[data-testid="parameter-set-item"]').should(
      "have.length.greaterThan",
      0
    );
  });

  it("should expand parameter set details", () => {
    cy.get('[data-testid="parameter-set-item"]').first().click();
    cy.get('[data-testid="parameter-details"]').should("be.visible");
  });

  it("should load parameter set", () => {
    cy.get('[data-testid="parameter-set-item"]').first().click();
    cy.get('button[data-testid="load-button"]').click();

    cy.get('[data-testid="success-message"]').should("be.visible");
  });

  it("should set parameter set as default", () => {
    cy.get('[data-testid="parameter-set-item"]').first().click();
    cy.get('button[data-testid="set-default-button"]').click();

    cy.get('[data-testid="success-message"]').should("be.visible");
  });

  it("should create new parameter set", () => {
    cy.get('button[data-testid="create-button"]').click();

    cy.get('input[name="description"]').type("Test Parameter Set");
    cy.get('input[name="duty"]').type("10");
    cy.get('input[name="optimalMargin"]').type("55");
    cy.get('select[name="purchaseCurrency"]').select("EUR");
    cy.get('select[name="sellingCurrency"]').select("USD");

    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="success-message"]').should("be.visible");
  });

  it("should edit existing parameter set", () => {
    cy.get('[data-testid="parameter-set-item"]').first().click();
    cy.get('button[data-testid="edit-button"]').click();

    cy.get('input[name="duty"]').clear().type("15");
    cy.get('button[type="submit"]').click();

    cy.get('[data-testid="success-message"]').should("be.visible");
  });

  it("should delete parameter set", () => {
    cy.get('[data-testid="parameter-set-item"]').first().click();
    cy.get('button[data-testid="delete-button"]').click();

    cy.get('[data-testid="confirm-dialog"]').should("be.visible");
    cy.get('button[data-testid="confirm-delete"]').click();

    cy.get('[data-testid="success-message"]').should("be.visible");
  });

  it("should show loading state during operations", () => {
    cy.intercept("POST", "/api/parameter-sets/*/load", { delay: 1000 }).as(
      "loadParameterSet"
    );

    cy.get('[data-testid="parameter-set-item"]').first().click();
    cy.get('button[data-testid="load-button"]').click();

    cy.get('[data-testid="loading-overlay"]').should("be.visible");
    cy.wait("@loadParameterSet");
  });

  it("should handle errors gracefully", () => {
    cy.intercept("POST", "/api/parameter-sets/*/load", { statusCode: 500 }).as(
      "loadParameterSetError"
    );

    cy.get('[data-testid="parameter-set-item"]').first().click();
    cy.get('button[data-testid="load-button"]').click();

    cy.get('[data-testid="error-message"]').should("be.visible");
  });
});
