import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';
import prisma from '../config/database';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc token không hợp lệ' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ success: false, error: 'Chưa đăng nhập hoặc token không hợp lệ' });
    return;
  }

  let decoded: JwtPayload;
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (
      typeof payload !== 'object' ||
      payload === null ||
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.fullName !== 'string'
    ) {
      res.status(401).json({ success: false, error: 'Token hết hạn hoặc không hợp lệ' });
      return;
    }
    decoded = payload as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token đã hết hạn, vui lòng đăng nhập lại' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.NotBeforeError) {
      res.status(401).json({ success: false, error: 'Token hết hạn hoặc không hợp lệ' });
      return;
    }
    next(error);
    return;
  }

  try {
    // Kiểm tra trạng thái tài khoản trong cơ sở dữ liệu để ngay lập tức vô hiệu hóa các phiên/token cũ của tài khoản bị khóa
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true, role: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'Tài khoản không tồn tại trên hệ thống' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Tài khoản của bạn đã bị khóa bởi Quản trị viên. Phiên làm việc đã bị chấm dứt.',
        isLocked: true,
      });
      return;
    }

    req.user = { ...decoded, role: user.role as JwtPayload['role'] };
    next();
  } catch (error) {
    next(error);
  }
}
