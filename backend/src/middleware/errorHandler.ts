import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { config } from '../config';
import { AttachmentError } from '../services/storage.service';

const DATABASE_UNAVAILABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2037']);

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const knownPrismaError = err instanceof Prisma.PrismaClientKnownRequestError ? err : undefined;
  const initializationError = err instanceof Prisma.PrismaClientInitializationError ? err : undefined;
  const errorCode = 'code' in err && typeof err.code === 'string' ? err.code : undefined;
  const prismaCode = knownPrismaError?.code || initializationError?.errorCode || errorCode;
  const meta = knownPrismaError?.meta;
  const transactionExpired = prismaCode === 'P2028' ||
    /transaction (?:not found|already closed)|interactive transaction.*(?:expired|timed out)/i.test(err.message);

  if (err instanceof AttachmentError) {
    console.error('[ATTACHMENT_ERROR]', JSON.stringify({
      method: req.method,
      path: req.path,
      code: err.code,
      operation: err.operation,
      status: err.statusCode,
    }));
    res.status(err.statusCode).json({ success: false, error: err.message, code: err.code });
    return;
  }

  if (err.name === 'MulterError') {
    const uploadError = err as Error & { code?: string };
    const tooLarge = uploadError.code === 'LIMIT_FILE_SIZE';
    const tooManyFiles = uploadError.code === 'LIMIT_FILE_COUNT';
    res.status(tooLarge ? 413 : 400).json({
      success: false,
      error: tooLarge
        ? `Tệp vượt giới hạn ${Math.floor(config.maxFileSize / 1_000_000)} MB.`
        : tooManyFiles ? 'Mỗi lần chỉ được tải lên một tệp.' : 'Thông tin tệp tải lên không hợp lệ.',
      code: uploadError.code || 'INVALID_UPLOAD',
    });
    return;
  }

  console.error('[API_ERROR]', JSON.stringify({
    method: req.method,
    path: req.path,
    name: err.name,
    prismaCode,
    modelName: typeof meta?.modelName === 'string' ? meta.modelName : undefined,
    table: typeof meta?.table === 'string' ? meta.table : undefined,
    column: typeof meta?.column === 'string' ? meta.column : undefined,
  }));

  if (transactionExpired) {
    res.status(503).json({
      success: false,
      error: 'Giao dịch lưu đã hết thời gian. Hãy tải lại hồ sơ để kiểm tra trạng thái trước khi thử lại.',
      code: 'TRANSACTION_RETRY',
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientInitializationError || DATABASE_UNAVAILABLE_CODES.has(prismaCode || '') || prismaCode === 'P2034') {
    res.status(503).json({
      success: false,
      error: 'Cơ sở dữ liệu tạm thời không khả dụng. Vui lòng thử lại sau.',
      code: 'DATABASE_UNAVAILABLE',
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Dữ liệu gửi lên không hợp lệ',
      data: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (knownPrismaError?.code === 'P2002') {
      const target = Array.isArray(meta?.target) ? meta.target.join(', ') : 'mã tài nguyên';
      res.status(409).json({
        success: false,
        error: `Giá trị ${target} đã tồn tại`,
        code: 'RESOURCE_ALREADY_EXISTS',
      });
      return;
    }
    if (knownPrismaError?.code === 'P2025') {
      res.status(404).json({ success: false, error: 'Không tìm thấy tài nguyên cần cập nhật' });
      return;
    }
    if (knownPrismaError?.code === 'P2003') {
      res.status(409).json({ success: false, error: 'Không thể cập nhật vì tài nguyên đang được liên kết' });
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Lỗi cấu hình cơ sở dữ liệu. Vui lòng liên hệ quản trị viên.',
      code: prismaCode === 'P2021' || prismaCode === 'P2022' ? 'DATABASE_SCHEMA_ERROR' : 'DATABASE_QUERY_ERROR',
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, error: 'Token không hợp lệ' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, error: 'Token đã hết hạn' });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Lỗi hệ thống, vui lòng thử lại sau',
  });
}
