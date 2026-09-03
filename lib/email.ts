import dayjs from 'dayjs';
import { transporter } from '@/lib/mailer';

export async function sendTaskAssignmentEmail({
  userEmail,
  userName,
  taskTitle,
  taskLink,
  duration,
}: {
  userEmail: string;
  userName: string;
  taskTitle: string;
  taskLink: string;
  duration?: Date;
}) {
  try {
    const info = await transporter.sendMail({
      from: `TaskBit <${
        process.env.EMAIL_FROM_ADDRESS || 'no-reply@insightedu.cloud'
      } >`,
      to: userEmail,
      subject: `New Task Assignment: ${taskTitle}`,
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
                  New Task Assigned
                </h2>

                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                  Hello <span style="color: #E78A53; font-weight: 600;">${userName}</span>,
                </p>

                <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">
                  You have been assigned to a new task:
                </p>

                <!-- Task Card -->
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                  <div style="margin-bottom: 15px;">
                    <h3 style="color: #E78A53; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">${taskTitle}</h3>
                    ${
                      duration
                        ? `
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      <span style="color: #64748b; font-size: 14px;">Delivery Date: ${dayjs(
                        duration,
                      ).format('DD MMM YYYY')}</span>
                    </div>
                    `
                        : ''
                    }
                  </div>
                </div>

                <!-- Action Button -->
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${taskLink}" style="display: inline-block; background: #E78A53; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: all 0.3s ease; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                    View Task Details
                  </a>
                </div>

                <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 30px;">
                  If you're unable to click the button, copy and paste this URL into your browser:<br>
                  <a href="${taskLink}" style="color: #E78A53; text-decoration: none;">${taskLink}</a>
                </p>
              </div>

              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-radius: 20px 20px 0 0;">
                <p style="color: #64748b; font-size: 14px; margin: 0 0 15px 0;">
                  Best regards,<br>
                  <span style="color: #1e293b; font-weight: 600;">TaskBit Team</span>
                </p>
                <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    This is an automated message, please do not reply to this email.
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    return info;
  } catch (error) {
    console.error('Error sending task assignment email:', error);
    throw error;
  }
}
