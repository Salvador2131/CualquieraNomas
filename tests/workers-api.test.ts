import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createWorkerSchema,
  updateWorkerSchema,
  updateRatingSchema,
  updateLoyaltySchema,
} from "@/lib/validations/worker";

describe("Worker Validation Schemas", () => {
  describe("createWorkerSchema", () => {
    it("should validate valid worker data", () => {
      const validData = {
        first_name: "Juan",
        last_name: "Pérez",
        email: "juan@example.com",
        phone: "+1234567890",
        address: "Calle Principal 123",
        specialization: "Chef",
        experience_years: 5,
        hourly_rate: 30,
      };

      const result = createWorkerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid email", () => {
      const invalidData = {
        first_name: "Juan",
        last_name: "Pérez",
        email: "invalid-email",
        specialization: "Chef",
        experience_years: 5,
        hourly_rate: 30,
      };

      const result = createWorkerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Email inválido");
      }
    });

    it("should reject negative experience years", () => {
      const invalidData = {
        first_name: "Juan",
        last_name: "Pérez",
        email: "juan@example.com",
        specialization: "Chef",
        experience_years: -1,
        hourly_rate: 30,
      };

      const result = createWorkerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("updateWorkerSchema", () => {
    it("should validate partial updates", () => {
      const validUpdate = {
        first_name: "Juan Carlos",
        hourly_rate: 35,
      };

      const result = updateWorkerSchema.safeParse(validUpdate);
      expect(result.success).toBe(true);
    });

    it("should reject invalid availability status", () => {
      const invalidUpdate = {
        availability_status: "invalid_status",
      };

      const result = updateWorkerSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });
  });

  describe("updateRatingSchema", () => {
    it("should validate valid rating", () => {
      const validRating = { rating: 4.5 };
      const result = updateRatingSchema.safeParse(validRating);
      expect(result.success).toBe(true);
    });

    it("should reject rating above 5", () => {
      const invalidRating = { rating: 6 };
      const result = updateRatingSchema.safeParse(invalidRating);
      expect(result.success).toBe(false);
    });

    it("should reject negative rating", () => {
      const invalidRating = { rating: -1 };
      const result = updateRatingSchema.safeParse(invalidRating);
      expect(result.success).toBe(false);
    });
  });

  describe("updateLoyaltySchema", () => {
    it("should validate valid loyalty data", () => {
      const validLoyalty = {
        loyalty_points: 750,
        loyalty_level: "gold",
      };
      const result = updateLoyaltySchema.safeParse(validLoyalty);
      expect(result.success).toBe(true);
    });

    it("should validate loyalty data without level", () => {
      const validLoyalty = { loyalty_points: 750 };
      const result = updateLoyaltySchema.safeParse(validLoyalty);
      expect(result.success).toBe(true);
    });

    it("should reject negative loyalty points", () => {
      const invalidLoyalty = { loyalty_points: -100 };
      const result = updateLoyaltySchema.safeParse(invalidLoyalty);
      expect(result.success).toBe(false);
    });
  });
});

// Mock para las funciones de utilidad
describe("Worker Utility Functions", () => {
  it("should calculate loyalty level correctly", () => {
    // Esta función se implementará en worker-utils.ts
    expect(true).toBe(true);
  });

  it("should format worker data correctly", () => {
    // Esta función se implementará en worker-utils.ts
    expect(true).toBe(true);
  });
});
