import nodemailer from "nodemailer";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  code?: string;
  error?: string;
  note?: string;
}

export function isSmtpConfigured(): boolean {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return Boolean(user && user.trim() && pass && pass.trim());
}

export function getSmtpStatus() {
  const configured = isSmtpConfigured();
  const rawUser = process.env.SMTP_USER || "";
  let userMasked = "not configured";
  if (rawUser) {
    const parts = rawUser.split("@");
    if (parts.length === 2) {
      userMasked = `${parts[0].slice(0, 2)}***@${parts[1]}`;
    } else {
      userMasked = `${rawUser.slice(0, 3)}***`;
    }
  }

  return {
    configured,
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    userMasked,
    from: process.env.SMTP_FROM || '"Sofi AI" <noreply@sofi.ai>'
  };
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send an email verification code using configured SMTP transport or fallback preview
 */
export async function sendVerificationEmail(
  email: string,
  nameOrUsername: string,
  code: string
): Promise<SendEmailResult> {
  const host = (process.env.SMTP_HOST || "smtp.gmail.com").trim();
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER?.trim();
  // Strip whitespace from Gmail app passwords if user pasted with spaces
  let pass = process.env.SMTP_PASS?.trim();
  if (pass && host.includes("gmail") && pass.includes(" ")) {
    pass = pass.replace(/\s+/g, "");
  }
  const from = process.env.SMTP_FROM || `"Sofi AI" <${user || "noreply@dewmanthi.site"}>`;

  // If SMTP credentials are NOT configured in .env, provide simulated verification
  if (!user || !pass) {
    console.log(`\n======================================================`);
    console.log(`[SMTP NOTICE] SMTP credentials not set in .env.`);
    console.log(`[SMTP CODE] Verification code for ${email} (${nameOrUsername}): [ ${code} ]`);
    console.log(`[SMTP NOTICE] To enable real emails, configure SMTP_USER & SMTP_PASS in .env`);
    console.log(`======================================================\n`);
    return {
      success: true,
      simulated: true,
      code,
      note: "SMTP_USER or SMTP_PASS not set in .env. Test code logged to server console."
    };
  }

  try {
    const isGmail = host.toLowerCase().includes("gmail");
    const transportOptions: any = {
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    };

    if (isGmail && port === 587) {
      transportOptions.requireTLS = true;
    }

    const transporter = nodemailer.createTransport(transportOptions);

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your Sofi Account</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0E0705; color: #FFFFFF; margin: 0; padding: 24px; }
    .card { max-width: 520px; margin: 0 auto; background: #180D0A; border: 1px solid #331A12; border-radius: 20px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 24px; }
    .badge { display: inline-block; background: rgba(255, 106, 61, 0.15); color: #FF8A50; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 999px; border: 1px solid rgba(255, 106, 61, 0.3); }
    .title { color: #FFFFFF; font-size: 22px; font-weight: 800; margin-top: 16px; margin-bottom: 8px; }
    .subtitle { color: #D1BDB7; font-size: 14px; line-height: 1.5; margin: 0; }
    .code-box { margin: 28px 0; background: #23120E; border: 1.5px dashed #FF6A3D; border-radius: 14px; padding: 20px; text-align: center; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #FF6A3D; }
    .expiry { color: #9E857E; font-size: 12px; margin-top: 8px; }
    .info { color: #C4ABA3; font-size: 13px; line-height: 1.6; margin-bottom: 24px; }
    .footer { border-top: 1px solid #29150F; padding-top: 20px; text-align: center; font-size: 11px; color: #7A635C; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="badge">Sofi AI Security</span>
      <h1 class="title">Verify Your Email Address</h1>
      <p class="subtitle">Hello <strong>${nameOrUsername}</strong>, welcome to Sofi AI Assistant.</p>
    </div>

    <p class="info">Please use the 6-digit confirmation code below to complete your registration and activate your account:</p>

    <div class="code-box">
      <div class="code">${code}</div>
      <div class="expiry">Expires in 10 minutes</div>
    </div>

    <p class="info">If you didn't create a Sofi account with this email address, you can safely ignore this message.</p>

    <div class="footer">
      Sofi Autonomous AI Companion • Powered by MongoDB on AWS & Hybrid AI
    </div>
  </div>
</body>
</html>
    `;

    const textContent = `
Sofi AI - Email Verification
----------------------------------------
Hello ${nameOrUsername},

Your Sofi verification code is: ${code}

This code will expire in 10 minutes.
If you did not request this verification code, please disregard this email.

Sofi Autonomous AI Companion
    `;

    console.log(`[SMTP] Sending verification email to ${email} via ${host}:${port}...`);
    const info = await transporter.sendMail({
      from,
      to: email,
      subject: `Your Sofi AI Verification Code: ${code}`,
      text: textContent,
      html: htmlContent
    });

    console.log(`[SMTP] Verification email sent successfully to ${email}. MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      simulated: false,
      code
    };
  } catch (err: any) {
    console.error(`[SMTP ERROR] Failed to send email via SMTP to ${email}:`, err);
    // Return error information and in dev/local mode allow fallback code
    return {
      success: false,
      error: err.message || "Failed to send email through SMTP.",
      code // Keep available so the user is not locked out during SMTP misconfigurations
    };
  }
}
