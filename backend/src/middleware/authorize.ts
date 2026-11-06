import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';
import { Permission, hasPermission, hasAnyPermission } from '../config/permissions';

/**
 * Authorize access based on Allowed User Roles
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
      return;
    }
    // Người không có vai trò hoặc vai trò không hợp lệ sẽ bị từ chối ngay lập tức
    if (!req.user.role || !Object.values(UserRole).includes(req.user.role as UserRole)) {
      res.status(403).json({ success: false, error: 'Tài khoản chưa được phân quyền vai trò để truy cập hệ thống' });
      return;
    }
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      res.status(403).json({ 
        success: false, 
        error: `Tài khoản vai trò [${req.user.role}] không có quyền truy cập chức năng này` 
      });
      return;
    }
    next();
  };
}

/**
 * Authorize access based on Specific Fine-Grained Permissions
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
      return;
    }

    const hasAccess = hasAnyPermission(req.user.role, permissions);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: `Tài khoản không đủ quyền hạn thực hiện thao tác này. Cần quyền: [${permissions.join(', ')}]`,
      });
      return;
    }

    next();
  };
}

