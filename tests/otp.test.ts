import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateOtp, storeOtp, verifyOtp } from "../utils/otp.js";

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

describe("storeOtp / verifyOtp", () => {
  beforeEach(() => {
    // Clear any leftover OTPs by using a unique target each test
  });

  it("verifies a stored OTP successfully", () => {
    storeOtp("test@example.com", "123456");
    expect(verifyOtp("test@example.com", "123456")).toBe(true);
  });

  it("rejects a wrong OTP", () => {
    storeOtp("user@example.com", "111111");
    expect(verifyOtp("user@example.com", "999999")).toBe(false);
  });

  it("rejects an OTP for an unknown target", () => {
    expect(verifyOtp("nobody@example.com", "000000")).toBe(false);
  });

  it("deletes the OTP after successful verification (single-use)", () => {
    storeOtp("once@example.com", "654321");
    expect(verifyOtp("once@example.com", "654321")).toBe(true);
    // Second attempt must fail
    expect(verifyOtp("once@example.com", "654321")).toBe(false);
  });

  it("rejects an expired OTP", () => {
    // Freeze time, store OTP, advance past 10 min, verify
    const now = Date.now();
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(now)          // storeOtp call
      .mockReturnValueOnce(now + 11 * 60 * 1000); // verifyOtp expiry check

    storeOtp("expire@example.com", "777777");
    expect(verifyOtp("expire@example.com", "777777")).toBe(false);

    vi.restoreAllMocks();
  });
});
