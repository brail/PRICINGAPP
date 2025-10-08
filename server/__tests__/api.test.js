const request = require("supertest");
const app = require("../index");

describe("API Endpoints", () => {
  describe("GET /api/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toHaveProperty("status", "OK");
    });
  });

  describe("GET /api/params", () => {
    it("should return current parameters", async () => {
      const response = await request(app).get("/api/params").expect(200);

      expect(response.body).toHaveProperty("duty");
      expect(response.body).toHaveProperty("optimalMargin");
      expect(response.body).toHaveProperty("purchaseCurrency");
      expect(response.body).toHaveProperty("sellingCurrency");
    });
  });

  describe("PUT /api/params", () => {
    it("should update parameters", async () => {
      const newParams = {
        duty: 10,
        optimalMargin: 50,
        purchaseCurrency: "EUR",
        sellingCurrency: "USD",
      };

      const response = await request(app)
        .put("/api/params")
        .send(newParams)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Parametri aggiornati con successo"
      );
    });

    it("should validate parameter values", async () => {
      const invalidParams = {
        duty: -5, // Invalid negative value
        optimalMargin: 150, // Invalid high value
      };

      await request(app).put("/api/params").send(invalidParams).expect(400);
    });
  });

  describe("POST /api/calculate-selling", () => {
    it("should calculate selling price", async () => {
      const calculationData = {
        purchasePrice: 100,
        currency: "USD",
      };

      const response = await request(app)
        .post("/api/calculate-selling")
        .send(calculationData)
        .expect(200);

      expect(response.body).toHaveProperty("retailPrice");
      expect(response.body).toHaveProperty("purchasePrice");
      expect(response.body).toHaveProperty("margin");
      expect(response.body.retailPrice).toBeGreaterThan(
        calculationData.purchasePrice
      );
    });

    it("should validate calculation input", async () => {
      const invalidData = {
        purchasePrice: -50, // Invalid negative price
        currency: "USD",
      };

      await request(app)
        .post("/api/calculate-selling")
        .send(invalidData)
        .expect(400);
    });
  });

  describe("POST /api/calculate-purchase", () => {
    it("should calculate purchase price", async () => {
      const calculationData = {
        retailPrice: 150,
        currency: "EUR",
      };

      const response = await request(app)
        .post("/api/calculate-purchase")
        .send(calculationData)
        .expect(200);

      expect(response.body).toHaveProperty("purchasePrice");
      expect(response.body).toHaveProperty("retailPrice");
      expect(response.body).toHaveProperty("margin");
      expect(response.body.purchasePrice).toBeLessThan(
        calculationData.retailPrice
      );
    });
  });

  describe("GET /api/parameter-sets", () => {
    it("should return parameter sets list", async () => {
      const response = await request(app)
        .get("/api/parameter-sets")
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty("id");
        expect(response.body[0]).toHaveProperty("description");
        expect(response.body[0]).toHaveProperty("duty");
        expect(response.body[0]).toHaveProperty("optimalMargin");
      }
    });
  });

  describe("POST /api/parameter-sets", () => {
    it("should create new parameter set", async () => {
      const newSet = {
        description: "Test Parameter Set",
        duty: 12,
        optimalMargin: 55,
        purchaseCurrency: "GBP",
        sellingCurrency: "USD",
      };

      const response = await request(app)
        .post("/api/parameter-sets")
        .send(newSet)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("description", newSet.description);
    });

    it("should validate parameter set data", async () => {
      const invalidSet = {
        description: "", // Empty description
        duty: -10, // Invalid duty
        optimalMargin: 200, // Invalid margin
      };

      await request(app)
        .post("/api/parameter-sets")
        .send(invalidSet)
        .expect(400);
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for non-existent endpoints", async () => {
      await request(app).get("/api/non-existent").expect(404);
    });

    it("should handle malformed JSON", async () => {
      await request(app)
        .post("/api/params")
        .set("Content-Type", "application/json")
        .send("invalid json")
        .expect(400);
    });
  });
});
