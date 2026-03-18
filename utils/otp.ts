// In-memory OTP store — expires in 10 minutes, no need to persist
const otps: Record<string, { otp: string; expires: number }> = {};

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function storeOtp(target: string, otp: string): void {
  otps[target] = { otp, expires: Date.now() + 10 * 60 * 1000 };
}

export function verifyOtp(target: string, otp: string): boolean {
  const stored = otps[target];
  if (!stored || stored.expires < Date.now()) return false;
  if (stored.otp !== otp) return false;
  delete otps[target];
  return true;
}
