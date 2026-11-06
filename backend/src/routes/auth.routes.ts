import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  login,
  register,
  requestPasswordReset,
  verifyResetOtp,
  verifyResetToken,
  resetPassword,
  getUserById,
} from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getPermissionsForRole, ROLE_PERMISSIONS } from '../config/permissions';
import prisma from '../config/database';

const router = Router();

// Schema xác thực đăng nhập
const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

// Schema xác thực đăng ký tài khoản
const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
    email: z.string().email('Email không đúng định dạng'),
    phone: z
      .string()
      .regex(/^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, 'Số điện thoại không hợp lệ (phải là số điện thoại Việt Nam 10 số)')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu'),
    department: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập',
    path: ['confirmPassword'],
  });

// Schema yêu cầu khôi phục mật khẩu
const forgotPasswordSchema = z.object({
  email: z.string().email('Vui lòng nhập đúng định dạng email đã đăng ký'),
});

// Schema xác thực mã OTP 6 số
const verifyOtpSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  otp: z.string().length(6, 'Mã xác minh phải bao gồm đúng 6 chữ số'),
});

// Schema đặt lại mật khẩu mới
const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Mã xác minh không được để trống'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
    confirmPassword: z.string().min(6, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp với mật khẩu mới',
    path: ['confirmPassword'],
  });

// 1. Đăng nhập
router.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json({ success: true, data: result });
  } catch (err: any) {
    const isPermanentLock = err.message.includes('Quản trị viên') || err.message.includes('quản trị viên');
    const isLocked = err.message.includes('khóa') || err.message.includes('khoá');
    const statusCode = isPermanentLock ? 403 : (isLocked ? 429 : 401);
    res.status(statusCode).json({ success: false, error: err.message, isLocked, isPermanentLock });
  }
});

// 2. Đăng ký tài khoản mới (Gán quyền cơ bản BTC)
router.post('/register', validate(registerSchema), async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, phone, department } = req.body;
    const user = await register({
      fullName,
      email,
      password,
      phone: phone || undefined,
      department: department || undefined,
    });
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Bạn có thể sử dụng email và mật khẩu để đăng nhập.',
      data: user,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3. Quên mật khẩu - Yêu cầu gửi mã khôi phục
router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const result = await requestPasswordReset(email);
    res.json({ success: true, message: result.message });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 3.1. Xác thực mã OTP 6 số và nhận phiên đặt lại mật khẩu
router.post('/verify-otp', validate(verifyOtpSchema), async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyResetOtp(email, otp);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 4. Kiểm tra tính hợp lệ của token đặt lại mật khẩu
router.get('/verify-reset-token', async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) {
      res.status(400).json({ success: false, error: 'Thiếu mã khôi phục' });
      return;
    }
    const result = await verifyResetToken(token);
    if (!result.valid) {
      res.status(400).json({ success: false, error: result.error });
      return;
    }
    res.json({ success: true, email: result.email });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 5. Đặt lại mật khẩu mới
router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    const result = await resetPassword(token, newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Đăng nhập / Đăng ký qua Google OAuth
router.post('/google', async (req: Request, res: Response) => {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      res.status(400).json({
        success: false,
        error:
          'Hệ thống chưa được cấu hình GOOGLE_CLIENT_ID phía máy chủ. Quản trị viên vui lòng tạo Google OAuth 2.0 Client ID trên Google Cloud Console và thêm vào tệp .env.',
      });
      return;
    }

    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ success: false, error: 'Thiếu thông tin chứng thực từ Google' });
      return;
    }

    // Khi Google Client ID được thiết lập, tiến hành xác thực token với Google OAuth API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!response.ok) {
      res.status(401).json({ success: false, error: 'Token chứng thực Google không hợp lệ hoặc đã hết hạn' });
      return;
    }

    const payload = (await response.json()) as any;
    if (payload.aud !== googleClientId) {
      res.status(401).json({ success: false, error: 'Khóa Client ID Google không trùng khớp' });
      return;
    }

    // Kiểm tra trạng thái tài khoản: Chặn tài khoản bị khóa đăng nhập bằng Google
    const normalizedEmail = (payload.email || '').trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser && !existingUser.isActive) {
      res.status(403).json({
        success: false,
        error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên. Đăng nhập Google bị từ chối.',
        isLocked: true,
      });
      return;
    }

    // Xử lý đăng nhập hoặc tự động tạo tài khoản với role BTC
    res.json({
      success: true,
      message: 'Xác thực Google thành công',
      data: { email: payload.email, fullName: payload.name },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Lỗi xác thực Google' });
  }
});

// 7. Yêu cầu mã OTP SMS (Đăng ký bằng SĐT)
router.post('/send-otp', async (req: Request, res: Response) => {
  res.status(400).json({
    success: false,
    error:
      'Dịch vụ gửi SMS OTP chưa được kết nối với nhà mạng (eSMS / Twilio / VNPT SMS Gateway). Quản trị viên vui lòng cấu hình API Key SMS Gateway trong tham số hệ thống.',
  });
});

// 8. Lấy thông tin tài khoản hiện tại
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getUserById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
      return;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// 9. Lấy quyền hạn người dùng
router.get('/permissions', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      role: req.user!.role,
      permissions: getPermissionsForRole(req.user!.role),
      allRolePermissions: ROLE_PERMISSIONS,
    },
  });
});

// 10. Đăng xuất
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

export default router;
