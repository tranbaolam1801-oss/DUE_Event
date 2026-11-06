import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types';

const router = Router();

/**
 * 1. Danh sách người dùng (ADMIN ONLY):
 * Bao gồm cả người dùng Đang hoạt động (ACTIVE) và Đã khóa (LOCKED)
 * để Admin có thể quản trị, theo dõi và mở khóa.
 */
router.get('/', authenticate, authorize(UserRole.ADMIN), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: Object.values(UserRole),
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

/**
 * 2. Khóa tài khoản người dùng (ADMIN ONLY):
 * - Không xóa tài khoản (KHÔNG DELETE), dữ liệu và quan hệ được bảo toàn 100%.
 * - Vô hiệu hóa quyền đăng nhập và các phiên đăng nhập cũ.
 * - Chặn tự khóa tài khoản Admin đang sử dụng.
 * - Chặn khóa tài khoản Admin cuối cùng còn hoạt động.
 * - Ghi nhận nhật ký kiểm toán (AuditLog).
 */
router.post('/:id/lock', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentAdminId = req.user!.userId;
    const { reason } = req.body;

    // Chặn tự khóa chính mình
    if (targetId === currentAdminId) {
      res.status(400).json({
        success: false,
        error: 'Bạn không thể tự khóa tài khoản Quản trị viên của chính mình.',
      });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản người dùng này.' });
      return;
    }

    if (!targetUser.isActive) {
      res.status(400).json({ success: false, error: 'Tài khoản này đã ở trạng thái bị khóa từ trước.' });
      return;
    }

    // Nếu khóa tài khoản có vai trò ADMIN, kiểm tra xem có còn Admin nào khác đang hoạt động không
    if (targetUser.role === UserRole.ADMIN) {
      const activeAdminCount = await prisma.user.count({
        where: { role: UserRole.ADMIN, isActive: true },
      });
      if (activeAdminCount <= 1) {
        res.status(400).json({
          success: false,
          error: 'Không thể khóa tài khoản Quản trị viên cuối cùng đang hoạt động của hệ thống.',
        });
        return;
      }
    }

    // Cập nhật trạng thái isActive = false (BẢO TOÀN MẬT KHẨU VÀ DỮ LIỆU)
    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Ghi nhật ký kiểm toán (AuditLog)
    try {
      await prisma.auditLog.create({
        data: {
          userId: currentAdminId,
          action: 'LOCK_USER',
          entityType: 'USER',
          entityId: targetUser.id,
          oldValue: JSON.stringify({ isActive: true }),
          newValue: JSON.stringify({
            isActive: false,
            reason: reason?.trim() || 'Khóa bởi Quản trị viên',
            targetEmail: targetUser.email,
          }),
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip,
          userAgent: req.headers['user-agent'] as string,
        },
      });
    } catch (auditErr) {
      console.error('[AUDIT_LOG_ERROR] Lỗi ghi nhật ký khóa tài khoản:', auditErr);
    }

    console.log(`[USER_LOCKED] Admin ${currentAdminId} đã khóa tài khoản ${targetUser.email}. Lý do: ${reason || 'Không có'}`);

    res.json({
      success: true,
      message: `Đã khóa tài khoản ${targetUser.fullName} thành công. Người dùng sẽ không thể đăng nhập hoặc tiếp tục sử dụng hệ thống.`,
      data: updatedUser,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi khóa tài khoản.' });
  }
});

/**
 * 3. Mở khóa tài khoản người dùng (ADMIN ONLY):
 * - Khôi phục trạng thái hoạt động isActive = true.
 * - Reset các hạn chế đăng nhập tạm thời (failedLoginAttempts = 0, lockedUntil = null).
 * - Người dùng đăng nhập lại bình thường bằng thông tin xác thực cũ, không cần đổi email/mật khẩu.
 * - Ghi nhận nhật ký kiểm toán (AuditLog).
 */
router.post('/:id/unlock', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
  try {
    const targetId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentAdminId = req.user!.userId;

    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản người dùng này.' });
      return;
    }

    if (targetUser.isActive) {
      res.status(400).json({ success: false, error: 'Tài khoản này đang ở trạng thái hoạt động.' });
      return;
    }

    // Cập nhật trạng thái isActive = true, đồng thời giải phóng khóa tạm thời nếu có
    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: {
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Ghi nhật ký kiểm toán (AuditLog)
    try {
      await prisma.auditLog.create({
        data: {
          userId: currentAdminId,
          action: 'UNLOCK_USER',
          entityType: 'USER',
          entityId: targetUser.id,
          oldValue: JSON.stringify({ isActive: false }),
          newValue: JSON.stringify({
            isActive: true,
            action: 'Mở khóa bởi Quản trị viên',
            targetEmail: targetUser.email,
          }),
          ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip,
          userAgent: req.headers['user-agent'] as string,
        },
      });
    } catch (auditErr) {
      console.error('[AUDIT_LOG_ERROR] Lỗi ghi nhật ký mở khóa tài khoản:', auditErr);
    }

    console.log(`[USER_UNLOCKED] Admin ${currentAdminId} đã mở khóa tài khoản ${targetUser.email}.`);

    res.json({
      success: true,
      message: `Đã mở khóa tài khoản ${targetUser.fullName} thành công. Người dùng có thể đăng nhập bình thường.`,
      data: updatedUser,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Lỗi khi mở khóa tài khoản.' });
  }
});

/**
 * 4. Tạo tài khoản mới (ADMIN ONLY)
 */
router.post('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, role, department, phone } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ success: false, error: 'Email đã được sử dụng' });
      return;
    }

    const passwordHash = await bcrypt.hash(password || '123456', 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role,
        department,
        phone,
      },
      select: { id: true, email: true, fullName: true, role: true, department: true, isActive: true },
    });

    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 5. Cập nhật thông tin tài khoản (ADMIN ONLY)
 */
router.put('/:id', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const currentAdminId = req.user!.userId;
    const { fullName, role, department, phone, isActive, password } = req.body;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      res.status(404).json({ success: false, error: 'Không tìm thấy người dùng này' });
      return;
    }

    // Bảo vệ an toàn: Nếu định khóa tài khoản qua PUT
    if (isActive === false && targetUser.isActive === true) {
      if (id === currentAdminId) {
        res.status(400).json({
          success: false,
          error: 'Bạn không thể tự khóa tài khoản Quản trị viên của chính mình.',
        });
        return;
      }
      if (targetUser.role === UserRole.ADMIN) {
        const activeAdminCount = await prisma.user.count({
          where: { role: UserRole.ADMIN, isActive: true },
        });
        if (activeAdminCount <= 1) {
          res.status(400).json({
            success: false,
            error: 'Không thể khóa tài khoản Quản trị viên cuối cùng đang hoạt động của hệ thống.',
          });
          return;
        }
      }
    }

    const data: Record<string, any> = { fullName, role, department, phone };
    if (typeof isActive === 'boolean') {
      data.isActive = isActive;
    }
    if (password && password.trim()) {
      data.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Ghi nhật ký kiểm toán nếu thay đổi trạng thái
    if (typeof isActive === 'boolean' && isActive !== targetUser.isActive) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: currentAdminId,
            action: isActive ? 'UNLOCK_USER' : 'LOCK_USER',
            entityType: 'USER',
            entityId: id,
            oldValue: JSON.stringify({ isActive: targetUser.isActive }),
            newValue: JSON.stringify({ isActive }),
            ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || req.ip,
            userAgent: req.headers['user-agent'] as string,
          },
        });
      } catch (err) {
        console.error('[AUDIT_LOG_ERROR]', err);
      }
    }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
