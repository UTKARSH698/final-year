import { pool } from "../db.js";

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOtp(target: string, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await pool.query(
    `INSERT INTO otp_tokens (target, otp, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (target) DO UPDATE SET otp = $2, expires_at = $3`,
    [target, otp, expiresAt]
  );
}

export async function verifyOtp(target: string, otp: string): Promise<boolean> {
  const { rows } = await pool.query(
    `DELETE FROM otp_tokens
     WHERE target = $1 AND otp = $2 AND expires_at > NOW()
     RETURNING target`,
    [target, otp]
  );
  return rows.length > 0;
}
