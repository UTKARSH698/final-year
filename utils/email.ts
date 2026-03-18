import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmailOtp(email: string, otp: string): Promise<void> {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[DEMO] Email OTP for ${email}: ${otp}`);
    return;
  }
  await transporter.sendMail({
    from: `"AgriFuture Intelligence" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your AgriFuture Verification Code",
    html: `
      <div style="font-family:sans-serif;padding:24px;max-width:480px;margin:auto;background:#fafafa;border-radius:8px;">
        <h2 style="color:#D4AF37;margin:0 0 16px">AgriFuture Intelligence</h2>
        <p style="margin:0 0 8px">Your one-time verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;margin:16px 0;color:#222">${otp}</div>
        <p style="color:#666;font-size:13px">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
      </div>`,
  });
}
