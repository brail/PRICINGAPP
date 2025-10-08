const request = require("supertest");
const app = require("../app");

describe("API Endpoints - Simple Tests", () => {
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
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for non-existent endpoints", async () => {
      await request(app).get("/api/non-existent").expect(404);
    });
  });
});
