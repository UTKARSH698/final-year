import { describe, it, expect } from "vitest";
import crypto from "crypto";

// Pure function extracted from routes/payments.ts for unit testing
function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return signature === expected;
}

const TEST_SECRET = "test_secret_key";

function makeSignature(orderId: string, paymentId: string): string {
  return crypto
    .createHmac("sha256", TEST_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

describe("verifyRazorpaySignature", () => {
  it("returns true for a valid signature", () => {
    const orderId = "order_abc123";
    const paymentId = "pay_xyz789";
    const sig = makeSignature(orderId, paymentId);
    expect(verifyRazorpaySignature(orderId, paymentId, sig, TEST_SECRET)).toBe(true);
  });

  it("returns false when signature is tampered", () => {
    const orderId = "order_abc123";
    const paymentId = "pay_xyz789";
    expect(
      verifyRazorpaySignature(orderId, paymentId, "bad_signature", TEST_SECRET)
    ).toBe(false);
  });

  it("returns false when orderId is swapped", () => {
    const sig = makeSignature("order_real", "pay_xyz789");
    expect(
      verifyRazorpaySignature("order_fake", "pay_xyz789", sig, TEST_SECRET)
    ).toBe(false);
  });

  it("returns false when paymentId is swapped", () => {
    const sig = makeSignature("order_abc123", "pay_real");
    expect(
      verifyRazorpaySignature("order_abc123", "pay_fake", sig, TEST_SECRET)
    ).toBe(false);
  });

  it("returns false when wrong secret is used", () => {
    const sig = makeSignature("order_abc123", "pay_xyz789");
    expect(
      verifyRazorpaySignature("order_abc123", "pay_xyz789", sig, "wrong_secret")
    ).toBe(false);
  });
});
