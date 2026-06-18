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

export class EmailUtil {
  public static async sendVerificationEmail(to: string, token: string) {
    const verifyLink = `http://localhost:3000/verify?token=${token}`;

    await transporter.sendMail({
      from: 'TechReborn <onboarding@resend.dev>', // MUST use this on free tier
      to,
      subject: 'Verify your TechReborn Account',
      html: `
        <h2>Welcome to TechReborn!</h2>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verifyLink}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Verify Email</a>
      `,
    });
  }

  public static async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
      from: 'TechReborn <onboarding@resend.dev>', // MUST use this on free tier
      to,
      subject: 'Reset your TechReborn Password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetLink}" style="padding: 10px 20px; background: #000; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
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

    const html = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333; line-height: 1.6;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin-bottom: 10px; font-size: 28px;">Thank You For Your Order!</h1>
          <p style="color: #666; font-size: 16px;">Hi ${customerName}, we successfully received your order <strong>#${shortOrderId}</strong>.</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; margin-bottom: 30px; text-align: center;">
          <p style="font-size: 16px; margin-bottom: 15px;">Your complete order details, billing information, and a full itemized receipt have been securely attached to this email as a PDF document.</p>
          <p style="font-size: 16px; margin: 0; color: #10b981; font-weight: bold;">Please download the attached PDF to view your official invoice.</p>
        </div>

        <p style="font-size: 15px;">We will send you another update as soon as your package ships. If you have any questions or need to make changes to your order, please don't hesitate to reply to this email.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; text-align: center;">
          <p>TechReborn &bull; 123 Tech Lane &bull; San Francisco, CA 94107</p>
          <p>&copy; ${new Date().getFullYear()} TechReborn. All rights reserved.</p>
        </div>
      </div>
    `;

    try {
      const attachments = pdfBuffer ? [{
        filename: `Invoice_#${shortOrderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }] : undefined;

      await transporter.sendMail({
        from: 'TechReborn <onboarding@resend.dev>', // MUST use this on free tier
        to,
        subject: `Order Confirmation - #${shortOrderId}`,
        html,
        attachments,
      });
    } catch (error) {
      console.error("Failed to send order confirmation email:", error);
      // We don't throw here to avoid failing the checkout if email fails
    }
  }
}
