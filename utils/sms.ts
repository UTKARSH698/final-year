export async function sendSmsOtp(phone: string, otp: string): Promise<void> {
  const authKey    = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey || !templateId) {
    console.log(`[DEMO] SMS OTP for ${phone}: ${otp}`);
    return;
  }

  let cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;

  try {
    const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanPhone}&authkey=${authKey}&otp=${otp}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    if (data.type !== "success") throw new Error(data.message || "MSG91 rejected");
  } catch (err: any) {
    console.error("[MSG91] Error:", err.message);
    console.log(`[FALLBACK] SMS OTP for ${phone}: ${otp}`);
  }
}
