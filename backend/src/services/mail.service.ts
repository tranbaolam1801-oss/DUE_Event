import nodemailer from 'nodemailer';

interface SendMailResult {
  sent: boolean;
  messageId?: string;
  reason?: string;
}

/**
 * Khởi tạo transporter cho nodemailer dựa trên biến môi trường SMTP
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

/**
 * Gửi email chứa mã OTP xác minh khôi phục mật khẩu
 */
export async function sendPasswordResetOtpEmail(
  toEmail: string,
  otpCode: string,
  fullName?: string
): Promise<SendMailResult> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"MY DUE - Quản lý Sự kiện" <noreply@due.udn.vn>';

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #005597; padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 0.5px;">TRƯỜNG ĐẠI HỌC KINH TẾ – ĐẠI HỌC ĐÀ NẴNG</h1>
        <p style="margin: 6px 0 0; font-size: 13px; color: #cbd5e1;">Hệ thống Quản lý Quy trình Tiếp nhận, Xét duyệt và Cấp phép Tổ chức Sự kiện</p>
      </div>
      <div style="padding: 28px 24px; color: #1e293b;">
        <p style="margin: 0 0 16px; font-size: 14px;">Xin chào <strong>${fullName || toEmail}</strong>,</p>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
          Hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với địa chỉ email này. Vui lòng sử dụng mã xác minh (OTP) dưới đây để hoàn tất việc đặt lại mật khẩu:
        </p>
        <div style="margin: 24px 0; text-align: center;">
          <div style="display: inline-block; background-color: #f0f7ff; border: 2px dashed #005597; border-radius: 10px; padding: 14px 32px;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #005597;">${otpCode}</span>
          </div>
        </div>
        <p style="margin: 0 0 12px; font-size: 13px; color: #64748b; line-height: 1.5;">
          ⏱️ Mã xác thực này có hiệu lực trong vòng <strong>5 phút</strong> kể từ thời điểm gửi. Mỗi mã chỉ có thể sử dụng một lần duy nhất.
        </p>
        <p style="margin: 0 0 20px; font-size: 13px; color: #dc2626; line-height: 1.5;">
          🔒 <strong>Lưu ý an toàn:</strong> Tuyệt đối không chia sẻ mã này với bất kỳ ai, kể cả nhân viên quản trị kỹ thuật.
        </p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Nếu bạn không thực hiện yêu cầu này, có thể ai đó đã nhập nhầm địa chỉ email của bạn. Mật khẩu của bạn vẫn an toàn và bạn có thể an tâm bỏ qua email này.
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
        © ${new Date().getFullYear()} Trường Đại học Kinh tế – Đại học Đà Nẵng. 71 Ngũ Hành Sơn, TP. Đà Nẵng.
      </div>
    </div>
  `;

  if (!transporter) {
    console.warn(`\n[EMAIL SERVICE NOT CONFIGURED]`);
    console.warn(`Để gửi email thật qua SMTP, hãy thêm cấu hình sau vào file backend/.env:`);
    console.warn(`SMTP_HOST=smtp.gmail.com`);
    console.warn(`SMTP_PORT=587`);
    console.warn(`SMTP_USER=your_email@gmail.com`);
    console.warn(`SMTP_PASS=your_app_password`);
    console.warn(`EMAIL_FROM="MY DUE - Event Management" <your_email@gmail.com>`);
    console.log(`[DEV OTP NOTIFICATION] Email: ${toEmail} | Mã OTP: ${otpCode} (Hết hạn sau 5 phút)\n`);
    
    return {
      sent: false,
      reason: 'SMTP_NOT_CONFIGURED',
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: `[MY DUE] Mã xác thực khôi phục mật khẩu: ${otpCode}`,
      html: htmlContent,
    });
    console.log(`[EMAIL SENT] Đã gửi mã OTP đến ${toEmail}. MessageId: ${info.messageId}`);
    return {
      sent: true,
      messageId: info.messageId,
    };
  } catch (err: any) {
    console.error(`[EMAIL ERROR] Không thể gửi thư đến ${toEmail}:`, err.message);
    return {
      sent: false,
      reason: err.message,
    };
  }
}
