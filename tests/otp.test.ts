import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock the pool before importing otp utils ─────────────────────────────────
vi.mock("../db.js", () => ({
  pool: {
    query: vi.fn(),
  },
}));

import { pool } from "../db.js";
import { generateOtp, storeOtp, verifyOtp } from "../utils/otp.js";

const mockQuery = pool.query as ReturnType<typeof vi.fn>;

describe("generateOtp", () => {
  it("returns a 6-digit string", () => {
    const otp = generateOtp();
    expect(otp).toMatch(/^\d{6}$/);
  });

  it("generates different values across calls", () => {
    const otps = new Set(Array.from({ length: 20 }, generateOtp));
    expect(otps.size).toBeGreaterThan(1);
  });
});

describe("storeOtp", () => {
  beforeEach(() => mockQuery.mockResolvedValue({ rows: [] }));

  it("inserts an OTP into the database", async () => {
    await storeOtp("test@example.com", "123456");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO otp_tokens"),
      expect.arrayContaining(["test@example.com", "123456"])
    );
  });
});

describe("verifyOtp", () => {
  it("returns true when DB deletes a matching row", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ target: "test@example.com" }] });
    expect(await verifyOtp("test@example.com", "123456")).toBe(true);
  });

  it("returns false when no row is deleted (wrong OTP or expired)", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    expect(await verifyOtp("test@example.com", "999999")).toBe(false);
  });

  it("issues a DELETE with the correct target and OTP", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await verifyOtp("user@example.com", "777777");
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining("DELETE FROM otp_tokens"),
      ["user@example.com", "777777"]
    );
  });
});
