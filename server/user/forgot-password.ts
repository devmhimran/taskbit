'use server';

import { prisma } from '@/prisma/db';
import { catchError, generateUnique6DigitCode } from '@/lib/utils';
import { transporter } from '@/lib/mailer';
import bcrypt from 'bcryptjs';

export async function sendForgotPasswordEmail(data: { email: string }) {
  const { email } = data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new Error('No account found with this email address');
    }

    const code = generateUnique6DigitCode();

    await prisma.forgotPassword.create({
      data: {
        code: code.toString(),
        is_valid: true,
        createdAt: new Date(),
        email,
      },
    });

    await transporter.sendMail({
      from: `TaskBit <${process.env.GMAIL_USER || 'no-reply@insightedu.cloud'}>`,
      to: email,
      subject: 'Password Reset Code - TaskBit',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
              <!-- Header -->
              <div style="background: #E78A53; padding: 40px 20px; text-align: center; border-radius: 0 0 20px 20px;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">TaskBit</h1>
              </div>

              <!-- Main Content -->
              <div style="padding: 40px 20px;">
                <h2 style="color: #1e293b; margin: 0 0 30px 0; font-size: 24px; font-weight: 600; text-align: center;">
                  Password Reset Request
                </h2>

                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                  Hello <span style="color: #E78A53; font-weight: 600;">${user.name}</span>,
                </p>

                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                  We received a request to reset your password. Use the verification code below:
                </p>

                <!-- Reset Code Box -->
                <div style="background: linear-gradient(135deg, #E78A53 0%, #d97742 100%); padding: 30px; border-radius: 15px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(231, 138, 83, 0.3);">
                  <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
                    Verification Code
                  </p>
                  <p style="color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                    ${code}
                  </p>
                </div>

                <div style="background-color: #fef3cd; border: 1px solid #fde047; border-radius: 10px; padding: 20px; margin: 25px 0;">
                  <p style="color: #a16207; font-size: 14px; margin: 0;">
                    <strong>⚠️ Important:</strong> This code will expire in 15 minutes for security reasons.
                  </p>
                </div>

                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                  If you didn't request this password reset, please ignore this email. Your account remains secure.
                </p>

                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; text-align: center;">
                  <p style="color: #64748b; font-size: 14px; margin: 0;">
                    Best regards,<br>
                    <span style="color: #E78A53; font-weight: 600;">TaskBit Team</span>
                  </p>
                  <p style="color: #94a3b8; font-size: 12px; margin: 15px 0 0 0;">
                    This email was sent from TaskBit. Please do not reply to this email.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return {
      success: true,
      message: 'Password reset code has been sent to your email address',
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return catchError(error);
  }
}

export async function verifyOtpCode(data: { code: string; email: string }) {
  const { code, email } = data;

  try {
    const otpRecord = await prisma.forgotPassword.findUnique({
      where: {
        code: code.toString(),
        is_valid: true,
        email,
      },
    });

    if (!otpRecord) {
      throw new Error('Invalid or expired verification code');
    }

    // Check if code is expired (15 minutes)
    const now = new Date();
    const codeCreatedAt = new Date(otpRecord.createdAt);
    const timeDifferenceInMinutes =
      (now.getTime() - codeCreatedAt.getTime()) / (1000 * 60);

    if (timeDifferenceInMinutes > 15) {
      // Invalidate expired code
      await prisma.forgotPassword.update({
        where: { id: otpRecord.id },
        data: { is_valid: false },
      });
      throw new Error(
        'Verification code has expired. Please request a new one.',
      );
    }

    // Delete the code from database after successful verification
    // await prisma.forgotPassword.delete({
    //   where: { id: otpRecord.id },
    // });

    return {
      success: true,
      message: 'Verification code confirmed successfully',
      codeId: otpRecord.id,
    };
  } catch (error) {
    console.error('OTP verification error:', error);
    return catchError(error);
  }
}

export async function resetPassword(data: {
  code: string;
  newPassword: string;
  email: string;
}) {
  const { code, newPassword, email } = data;

  try {
    const otpRecord = await prisma.forgotPassword.findUnique({
      where: {
        code: code.toString(),
        is_valid: true,
        email,
      },
    });

    if (!otpRecord) {
      throw new Error(
        'Your session has expired. Please request a new password reset.',
      );
    }

    await prisma.user.update({
      where: { email },
      data: { password: await bcrypt.hash(newPassword, 10) },
    });

    await prisma.forgotPassword.delete({
      where: { id: otpRecord.id },
    });

    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return catchError(error);
  }
}
