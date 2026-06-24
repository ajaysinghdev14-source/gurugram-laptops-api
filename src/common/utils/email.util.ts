import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

// Configure the SMTP transport for Resend
const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend', // Resend always uses 'resend' as the username
    pass: env.RESEND_API_KEY,
  },
});

// ─── Shared Email Layout ─────────────────────────────────
const COMPANY_NAME = 'Gurugram IT Networks';
const COMPANY_ADDRESS = 'Gurugram, Haryana, India';
const BRAND_COLOR = '#2563eb'; // Professional blue
const BRAND_COLOR_DARK = '#1d4ed8';

function emailWrapper(content: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, ${BRAND_COLOR}, ${BRAND_COLOR_DARK}); padding: 30px 40px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">${COMPANY_NAME}</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1.5px;">Premium Refurbished Laptops</p>
      </div>

      <!-- Body -->
      <div style="padding: 40px; border: 1px solid #e5e7eb; border-top: none;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; padding: 24px 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;">${COMPANY_NAME} &bull; ${COMPANY_ADDRESS}</p>
        <p style="margin: 0; color: #9ca3af; font-size: 11px;">&copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.</p>
      </div>
    </div>
  `;
}

function actionButton(text: string, href: string): string {
  return `
    <div style="text-align: center; margin: 32px 0;">
      <a href="${href}" style="display: inline-block; padding: 14px 32px; background-color: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">${text}</a>
    </div>
  `;
}

// ─── Email Templates ──────────────────────────────────────
export class EmailUtil {
  public static async sendVerificationEmail(to: string, token: string) {
    const verifyLink = `${env.FRONTEND_URL}/verify?token=${token}`;

    const html = emailWrapper(`
      <h2 style="color: #111827; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Verify Your Email</h2>
      <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        Welcome to ${COMPANY_NAME}! Please verify your email address to activate your account and access all features.
      </p>

      ${actionButton('Verify My Email', verifyLink)}

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${verifyLink}" style="color: ${BRAND_COLOR}; word-break: break-all;">${verifyLink}</a>
      </p>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">If you didn't create an account with us, you can safely ignore this email.</p>
      </div>
    `);

    await transporter.sendMail({
      from: `${COMPANY_NAME} <no-reply@gurugramitnetworks.com>`,
      to,
      subject: `Verify your email — ${COMPANY_NAME}`,
      html,
    });
  }

  public static async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;

    const html = emailWrapper(`
      <h2 style="color: #111827; margin: 0 0 8px; font-size: 22px; font-weight: 700;">Reset Your Password</h2>
      <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px; line-height: 1.6;">
        We received a request to reset the password for your ${COMPANY_NAME} account. Click the button below to set a new password.
      </p>

      ${actionButton('Reset Password', resetLink)}

      <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 14px 16px; margin: 24px 0;">
        <p style="color: #92400e; font-size: 13px; margin: 0; line-height: 1.5;">
          ⏰ <strong>This link expires in 1 hour.</strong> If it has expired, please request a new password reset.
        </p>
      </div>

      <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetLink}" style="color: ${BRAND_COLOR}; word-break: break-all;">${resetLink}</a>
      </p>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      </div>
    `);

    await transporter.sendMail({
      from: `${COMPANY_NAME} <no-reply@gurugramitnetworks.com>`,
      to,
      subject: `Reset your password — ${COMPANY_NAME}`,
      html,
    });
  }

  public static async sendOrderConfirmationEmail(
    to: string,
    customerName: string,
    orderId: string,
    totalAmount: string,
    shippingAddress: any,
    items: any[],
    pdfBuffer?: Buffer
  ) {
    const formatInr = (amount: number) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const shortOrderId = orderId?.split('-')[0]?.toUpperCase() || 'UNKNOWN';

    const html = emailWrapper(`
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; background-color: #ecfdf5; border-radius: 50%; padding: 16px; margin-bottom: 16px;">
          <span style="font-size: 32px;">✅</span>
        </div>
        <h2 style="color: #111827; margin: 0 0 8px; font-size: 24px; font-weight: 700;">Order Confirmed!</h2>
        <p style="color: #6b7280; margin: 0; font-size: 15px;">
          Thank you, <strong>${customerName}</strong>! Your order <strong style="color: ${BRAND_COLOR};">#${shortOrderId}</strong> has been placed successfully.
        </p>
      </div>

      <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px 24px; margin: 24px 0; text-align: center;">
        <p style="font-size: 15px; margin: 0 0 12px; color: #0c4a6e; line-height: 1.6;">
          Your complete order details, billing information, and a full itemized receipt have been attached to this email as a PDF.
        </p>
        <p style="font-size: 14px; margin: 0; color: ${BRAND_COLOR}; font-weight: 600;">
          📎 Please download the attached PDF to view your official invoice.
        </p>
      </div>

      <p style="font-size: 15px; color: #374151; line-height: 1.6; margin: 0 0 16px;">
        We will notify you as soon as your order ships. If you have any questions or need assistance, feel free to reply to this email — our team is happy to help!
      </p>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #f3f4f6;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Thank you for choosing ${COMPANY_NAME}. We appreciate your business!</p>
      </div>
    `);

    try {
      const attachments = pdfBuffer ? [{
        filename: `Invoice_#${shortOrderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : undefined;

      await transporter.sendMail({
        from: `${COMPANY_NAME} <no-reply@gurugramitnetworks.com>`,
        to,
        subject: `Order Confirmed — #${shortOrderId} | ${COMPANY_NAME}`,
        html,
        attachments,
      });
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      // We don't throw here to avoid failing the checkout if email fails
    }
  }
}
