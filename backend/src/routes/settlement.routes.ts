import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config';
import {
  assertAttachmentObjectExists,
  AttachmentError,
  removeAttachment,
  resolveAttachment,
  saveAttachment,
} from '../services/storage.service';
import prisma from '../config/database';
import {
  createSettlement,
  updateSettlement,
  submitSettlement,
  reviewSettlement,
  uploadFinancialDocument,
  verifyFinancialDocument,
  canUploadSettlementDocuments,
} from '../services/settlement.service';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types';
import { canUploadFinancialDocuments, canViewFinancialDocuments } from '../services/financialDocumentAccess';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxFileSize, files: 1, fields: 8, parts: 10, fieldSize: 16 * 1024 } });

function isPrismaError(error: unknown): boolean {
  return error instanceof Error && (
    error.name === 'PrismaClientInitializationError' ||
    ('code' in error && typeof error.code === 'string' && /^P\d{4}$/.test(error.code))
  );
}

// The path parameter is the internal Event.id, not the human-readable eventCode.
router.get('/:eventId', authenticate, authorize(UserRole.BTC, UserRole.KHTC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, deletedAt: true, createdById: true },
    });
    if (!event || event.deletedAt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ sự kiện' });
      return;
    }
    if (!canViewFinancialDocuments(req.user!.role, req.user!.userId, event.createdById)) {
      res.status(403).json({ success: false, error: 'Chỉ được xem chứng từ thuộc hồ sơ của mình' });
      return;
    }
    const settlement = await prisma.settlement.findFirst({
      where: { eventId },
      include: {
        items: true,
        documents: true,
        submittedBy: { select: { id: true, fullName: true } },
        reviewedBy: { select: { id: true, fullName: true } },
      },
    });
    res.json({ success: true, data: settlement });
  } catch (err) {
    next(err);
  }
});

// Create settlement
router.post('/', authenticate, authorize(UserRole.BTC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.body.eventId },
      select: { id: true, deletedAt: true, createdById: true },
    });
    if (!event || event.deletedAt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ sự kiện' });
      return;
    }
    if (!canUploadFinancialDocuments(req.user!.role, req.user!.userId, event.createdById)) {
      res.status(403).json({ success: false, error: 'BTC chỉ được tạo quyết toán cho hồ sơ do mình phụ trách' });
      return;
    }
    const settlement = await createSettlement(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: settlement });
  } catch (err) {
    if (isPrismaError(err)) {
      next(err);
      return;
    }
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Không thể cập nhật hồ sơ quyết toán' });
  }
});

// Update a draft or revision-requested settlement without removing existing expense rows.
router.put('/:id', authenticate, authorize(UserRole.BTC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const settlement = await prisma.settlement.findUnique({
      where: { id },
      select: {
        event: { select: { deletedAt: true, createdById: true, status: true } },
      },
    });
    if (!settlement || settlement.event.deletedAt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ quyết toán' });
      return;
    }
    if (!canUploadFinancialDocuments(req.user!.role, req.user!.userId, settlement.event.createdById)) {
      res.status(403).json({ success: false, error: 'BTC chỉ được chỉnh sửa quyết toán cho hồ sơ do mình phụ trách' });
      return;
    }
    const data = z.object({
      items: z.array(z.object({
        id: z.string().optional(),
        itemName: z.string(),
        category: z.string().nullable().optional(),
        budgetedAmount: z.number().finite().nonnegative(),
        actualAmount: z.number().finite().nonnegative(),
        notes: z.string().nullable().optional(),
      })).optional(),
      totalActual: z.number().finite().nonnegative().optional(),
      settlementDate: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    }).parse(req.body);
    const updated = await updateSettlement(id, data);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// Submit settlement
router.post('/:settlementId/submit', authenticate, authorize(UserRole.BTC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settlementId = Array.isArray(req.params.settlementId) ? req.params.settlementId[0] : req.params.settlementId;
    const submitted = await submitSettlement(settlementId, req.user!.userId, req.user!.role);
    res.json({ success: true, data: submitted, message: 'Đã nộp hồ sơ quyết toán cho Phòng KHTC' });
  } catch (err: any) {
    if (isPrismaError(err)) {
      next(err);
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

// Review settlement (KHTC)
router.post('/:id/review', authenticate, authorize(UserRole.KHTC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { decision, notes } = z.object({
      decision: z.enum(['APPROVED', 'REVISION_REQUESTED', 'REJECTED']),
      notes: z.string().optional().default(''),
    }).parse(req.body);
    const reviewed = await reviewSettlement(id, decision, notes, req.user!.userId);
    res.json({ success: true, data: reviewed, message: 'Đã xử lý quyết toán' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Upload supporting documents using the current private storage mechanism.
router.post(
  '/:id/documents/upload',
  authenticate,
  authorize(UserRole.BTC, UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settlementId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
        select: {
          status: true,
          event: { select: { deletedAt: true, createdById: true, status: true } },
        },
      });
      if (!settlement || settlement.event.deletedAt) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ quyết toán' });
        return;
      }
      if (!canUploadFinancialDocuments(req.user!.role, req.user!.userId, settlement.event.createdById)) {
        res.status(403).json({ success: false, error: 'BTC chỉ được tải chứng từ lên hồ sơ của mình' });
        return;
      }
      if (!canUploadSettlementDocuments(settlement.status, settlement.event.status)) {
        res.status(409).json({ success: false, error: 'Chỉ có thể thêm chứng từ khi quyết toán đang chỉnh sửa hoặc đã nộp chờ KHTC kiểm tra' });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const settlementId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const settlement = await prisma.settlement.findUnique({
        where: { id: settlementId },
        include: { event: true },
      });
      if (!settlement || settlement.event.deletedAt) {
        res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ quyết toán' });
        return;
      }
      if (!canUploadFinancialDocuments(req.user!.role, req.user!.userId, settlement.event.createdById)) {
        res.status(403).json({ success: false, error: 'BTC chỉ được tải chứng từ lên hồ sơ của mình' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ success: false, error: 'Chưa chọn tệp chứng từ' });
        return;
      }
      if (!canUploadSettlementDocuments(settlement.status, settlement.event.status)) {
        res.status(409).json({ success: false, error: 'Chỉ có thể thêm chứng từ khi quyết toán đang chỉnh sửa hoặc đã nộp chờ KHTC kiểm tra' });
        return;
      }
      const documentTypeResult = z.enum(['RECEIPT', 'INVOICE', 'CONTRACT', 'OTHER']).safeParse(req.body.documentType);
      if (!documentTypeResult.success) {
        res.status(400).json({ success: false, error: 'Loại chứng từ không hợp lệ' });
        return;
      }
      const documentType = documentTypeResult.data;
      const amount = req.body.amount === undefined || req.body.amount === '' ? undefined : Number(req.body.amount);
      if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
        res.status(400).json({ success: false, error: 'Số tiền chứng từ không hợp lệ' });
        return;
      }
      const suppliedIdempotencyKey = req.get('Idempotency-Key') || req.body.idempotencyKey;
      if (suppliedIdempotencyKey && !z.string().uuid().safeParse(suppliedIdempotencyKey).success) {
        res.status(400).json({ success: false, error: 'Mã yêu cầu tải chứng từ không hợp lệ' });
        return;
      }
      const idempotencyKey = suppliedIdempotencyKey || randomUUID();
      const previousDocument = await prisma.financialDocument.findUnique({ where: { id: idempotencyKey } });
      const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      if (previousDocument) {
        if (previousDocument.settlementId !== settlementId) {
          res.status(409).json({ success: false, error: 'Mã yêu cầu tải chứng từ đã được sử dụng cho hồ sơ khác' });
          return;
        }
        const retryFile = await saveAttachment(settlement.eventId, originalName, req.file.mimetype, req.file.buffer, idempotencyKey);
        if (previousDocument.filePath !== retryFile.filePath) {
          try {
            await removeAttachment(retryFile.filePath);
          } catch (cleanupError) {
            console.error('[UPLOAD_CLEANUP_FAILED]', JSON.stringify({
              operation: 'financial_document_idempotency_conflict',
              code: cleanupError instanceof AttachmentError ? cleanupError.code : 'UNKNOWN',
            }));
          }
          res.status(409).json({ success: false, error: 'Mã yêu cầu tải chứng từ đã được sử dụng cho tệp khác' });
          return;
        }
        await assertAttachmentObjectExists(previousDocument.filePath || '');
        res.json({ success: true, data: previousDocument, message: 'Chứng từ đã được lưu trước đó' });
        return;
      }
      const stored = await saveAttachment(settlement.eventId, originalName, req.file.mimetype, req.file.buffer, idempotencyKey);
      let document;
      try {
        document = await uploadFinancialDocument(settlementId, {
          id: idempotencyKey,
          uploaderId: req.user!.userId,
          documentType,
          documentNumber: req.body.documentNumber || undefined,
          amount,
          description: req.body.description || undefined,
          fileName: originalName,
          filePath: stored.filePath,
        });
      } catch (error) {
        let persistedDocument;
        try {
          persistedDocument = await prisma.financialDocument.findUnique({ where: { id: idempotencyKey } });
        } catch {
          console.error('[UPLOAD_RECONCILIATION_FAILED]', JSON.stringify({ operation: 'financial_document' }));
          next(error);
          return;
        }
        if (persistedDocument?.settlementId === settlementId && persistedDocument.filePath === stored.filePath) {
          res.json({ success: true, data: persistedDocument, message: 'Chứng từ đã được lưu thành công' });
          return;
        }
        try {
          await removeAttachment(stored.filePath);
        } catch (cleanupError) {
          console.error('[UPLOAD_CLEANUP_FAILED]', JSON.stringify({
            operation: 'financial_document',
            code: cleanupError instanceof AttachmentError ? cleanupError.code : 'UNKNOWN',
          }));
        }
        next(error);
        return;
      }
      if (document.filePath !== stored.filePath) {
        try {
          await removeAttachment(stored.filePath);
        } catch (cleanupError) {
          console.error('[UPLOAD_CLEANUP_FAILED]', JSON.stringify({
            operation: 'financial_document_duplicate',
            code: cleanupError instanceof AttachmentError ? cleanupError.code : 'UNKNOWN',
          }));
        }
      }
      res.status(201).json({ success: true, data: document, message: 'Tải chứng từ thành công' });
    } catch (err) {
      next(err);
    }
  }
);

// Download a financial document only through an authenticated event view.
router.get(
  '/:id/documents/:documentId/download',
  authenticate,
  authorize(UserRole.BTC, UserRole.KHTC, UserRole.ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settlementId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const documentId = Array.isArray(req.params.documentId) ? req.params.documentId[0] : req.params.documentId;
    const document = await prisma.financialDocument.findUnique({
      where: { id: documentId },
      include: { settlement: { include: { event: true } } },
    });
    if (!document || document.settlementId !== settlementId || document.settlement.event.deletedAt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy chứng từ' });
      return;
    }
    if (!canViewFinancialDocuments(
      req.user!.role,
      req.user!.userId,
      document.settlement.event.createdById
    )) {
      res.status(403).json({ success: false, error: 'BTC chỉ được xem chứng từ thuộc hồ sơ của mình' });
      return;
    }
    if (!document.filePath) {
      res.status(404).json({ success: false, error: 'Chứng từ chưa có tệp đính kèm' });
      return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    const inline = req.query.inline === 'true';
    const location = await resolveAttachment(document.filePath, !inline);
    if ('url' in location) {
      res.json({ success: true, url: location.url });
      return;
    }
    if (inline) {
      res.type(path.extname(document.fileName || 'chung-tu'));
      res.sendFile(location.localPath);
      return;
    }
    res.download(location.localPath, document.fileName || 'chung-tu');
  } catch (err) {
    next(err);
  }
});

router.post('/:id/documents', authenticate, (_req: Request, res: Response) => {
  res.status(410).json({
    success: false,
    error: 'Chứng từ phải được tải lên bằng API /documents/upload để xác nhận tệp đã lưu an toàn.',
  });
});

// Verify document (KHTC)
router.put('/documents/:docId/verify', authenticate, authorize(UserRole.KHTC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;
    const { isVerified } = req.body;
    const verified = await verifyFinancialDocument(docId, isVerified);
    res.json({ success: true, data: verified });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
