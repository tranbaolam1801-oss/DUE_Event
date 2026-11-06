import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { config } from '../config';
import { resolveAttachment, saveAttachment } from '../services/storage.service';
import prisma from '../config/database';
import {
  createSettlement,
  updateSettlement,
  submitSettlement,
  reviewSettlement,
  addFinancialDocument,
  uploadFinancialDocument,
  verifyFinancialDocument,
} from '../services/settlement.service';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxFileSize, files: 1 } });

// Get settlement by eventId
router.get('/:eventId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
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
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settlement = await createSettlement(req.body, req.user!.userId);
    res.status(201).json({ success: true, data: settlement });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update a draft or revision-requested settlement without removing existing expense rows.
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
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
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Submit settlement
router.post('/:id/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const submitted = await submitSettlement(id, req.user!.userId);
    res.json({ success: true, data: submitted, message: 'Đã nộp hồ sơ quyết toán cho Phòng KHTC' });
  } catch (err: any) {
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
router.post('/:id/documents/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
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
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Chưa chọn tệp chứng từ' });
      return;
    }
    if (!['DRAFT', 'REVISION_REQUESTED', 'REJECTED'].includes(settlement.status)) {
      res.status(400).json({ success: false, error: 'Không thể thêm chứng từ ở trạng thái quyết toán hiện tại' });
      return;
    }
    const documentType = z.enum(['RECEIPT', 'INVOICE', 'CONTRACT', 'OTHER']).parse(req.body.documentType);
    const amount = req.body.amount === undefined || req.body.amount === '' ? undefined : Number(req.body.amount);
    if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
      res.status(400).json({ success: false, error: 'Số tiền chứng từ không hợp lệ' });
      return;
    }
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const stored = await saveAttachment(settlement.eventId, originalName, req.file.mimetype, req.file.buffer);
    const document = await uploadFinancialDocument(settlementId, {
      documentType,
      documentNumber: req.body.documentNumber || undefined,
      amount,
      description: req.body.description || undefined,
      fileName: originalName,
      filePath: stored.filePath,
    });
    res.status(201).json({ success: true, data: document, message: 'Tải chứng từ thành công' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Download a financial document only through an authenticated event view.
router.get('/:id/documents/:documentId/download', authenticate, async (req: Request, res: Response) => {
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
    if (!document.filePath) {
      res.status(404).json({ success: false, error: 'Chứng từ chưa có tệp đính kèm' });
      return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    const location = await resolveAttachment(document.filePath);
    if ('url' in location) {
      res.json({ success: true, url: location.url });
      return;
    }
    res.download(location.localPath, document.fileName || 'chung-tu');
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Add document to settlement
router.post('/:id/documents', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const doc = await addFinancialDocument(id, req.body);
    res.status(201).json({ success: true, data: doc });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
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
