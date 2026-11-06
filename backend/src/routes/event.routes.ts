import multer from 'multer';
import { config } from '../config';

import { removeAttachment, saveAttachment, resolveAttachment } from '../services/storage.service';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxFileSize, files: 1 } });
import prisma from '../config/database';
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createEventSchema } from '../schemas/event.schema';
import { EventSubmissionValidationError } from '../services/eventSubmissionValidation';
import {
  EventCreateIdempotencyConflictError,
  EventEditAuthorizationError,
  EventEditStatusError,
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  submitEvent,
  getEventHistory,
  softDeleteEvent,
  restoreEvent,
} from '../services/event.service';
import { transitionState, getAvailableActions, WorkflowAuthorizationError } from '../services/workflow.service';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// List events
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, page, limit } = req.query;
    const deletedOnly = req.query.deleted === 'only';
    if (deletedOnly && req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Chỉ ADMIN được xem hồ sơ đã xóa' });
      return;
    }
    const result = await getEvents(
      {
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        deletedOnly,
      },
      req.user!.userId,
      req.user!.role
    );
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

// Create event
router.post('/', authenticate, validate(createEventSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!['BTC', 'ADMIN'].includes(req.user!.role)) { res.status(403).json({ error: 'Không có quyền tạo hồ sơ' }); return; }
    const requestId = req.get('Idempotency-Key');
    if (requestId && !z.string().uuid().safeParse(requestId).success) {
      res.status(400).json({ success: false, error: 'Mã yêu cầu lưu hồ sơ không hợp lệ' });
      return;
    }
    const event = await createEvent(req.body, req.user!.userId, undefined, requestId);
    res.status(201).json({ success: true, data: event });
  } catch (err: any) {
    if (err instanceof EventCreateIdempotencyConflictError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    res.status(400).json({ success: false, error: err.message });
  }
});

// Import is explicit, idempotent, and saves the untouched original for recovery.
router.post('/import-legacy', authenticate, async (req: Request, res: Response) => {
  try {
    if (!['BTC', 'ADMIN'].includes(req.user!.role) || req.body.createdById !== req.user!.userId) { res.status(403).json({ error: 'Chỉ được nhập hồ sơ của chính tài khoản này' }); return; }
    const sourceId = z.string().min(1).max(200).parse(req.body.id);
    const data = createEventSchema.parse({ ...req.body, booking: undefined });
    const event = await createEvent(data, req.user!.userId, { key: `legacy:${req.user!.userId}:${sourceId}`, snapshot: JSON.stringify(req.body) });
    res.json({ success: true, data: event });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Chỉ ADMIN được xóa hồ sơ' });
      return;
    }
    const { reason } = z.object({ reason: z.string().trim().min(1, 'Vui lòng nhập lý do xóa').max(1000) }).parse(req.body);
    const id = String(req.params.id);
    const data = await softDeleteEvent(id, req.user!.userId, reason);
    res.json({ success: true, data });
  } catch (error: any) {
    const status = error instanceof z.ZodError ? 400
      : error.message === 'Không tìm thấy hồ sơ' ? 404
        : error.message === 'Hồ sơ đã được xóa trước đó' || error.message.includes('đang diễn ra') ? 409
          : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});

router.post('/:id/restore', authenticate, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Chỉ ADMIN được khôi phục hồ sơ' });
      return;
    }
    const { reason } = z.object({ reason: z.string().trim().min(1, 'Vui lòng nhập lý do khôi phục').max(1000) }).parse(req.body);
    const data = await restoreEvent(String(req.params.id), req.user!.userId, reason);
    res.json({ success: true, data });
  } catch (error: any) {
    const status = error instanceof z.ZodError ? 400
      : error.message === 'Không tìm thấy hồ sơ đã xóa' ? 404
        : 400;
    res.status(status).json({ success: false, error: error.message });
  }
});
router.put('/:id/report', authenticate, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event || (!['BTC', 'ADMIN'].includes(req.user!.role))) { res.status(403).json({ error: 'Không có quyền lưu báo cáo này' }); return; }
    const data = z.object({ actualAttendees: z.number().int().nonnegative().optional(), summary: z.string().optional(), achievements: z.string().optional(), challenges: z.string().optional(), lessonsLearned: z.string().optional(), recommendations: z.string().optional(), status: z.enum(['DRAFT', 'SUBMITTED']).optional() }).parse(req.body);
    const report = await prisma.eventReport.upsert({ where: { eventId: id }, create: { ...data, eventId: id }, update: data });
    res.json({ success: true, data: report });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});
router.post('/:id/handover', authenticate, async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    if (!['CSVC', 'ADMIN'].includes(req.user!.role)) { res.status(403).json({ error: 'Chỉ cán bộ CSVC được xác nhận bàn giao' }); return; }
    const data = z.object({ type: z.enum(['PRE_EVENT', 'POST_EVENT']), facilityCondition: z.string(), equipmentNotes: z.string(), hasIncident: z.boolean().optional(), incidentDetails: z.string().optional() }).parse(req.body);
    const event = await prisma.event.findUniqueOrThrow({ where: { id } });
    const allowed = data.type === 'PRE_EVENT' ? ['READY_FOR_EVENT'] : ['FACILITY_RETURN_PENDING', 'FACILITY_INSPECTION'];
    if (!allowed.includes(event.status)) throw new Error('Trạng thái hồ sơ chưa cho phép lập biên bản này');
    const status = data.type === 'PRE_EVENT' ? 'FACILITY_HANDED_OVER' : data.hasIncident ? 'FACILITY_INCIDENT' : 'REPORT_PENDING';
    await prisma.$transaction(async tx => {
      await tx.handoverRecord.create({ data: { eventId: id, type: data.type, handoverById: req.user!.userId, receivedById: event.createdById, facilityCondition: data.facilityCondition, equipmentList: data.equipmentNotes, notes: data.incidentDetails, status: 'CONFIRMED', confirmedAt: new Date() } });
      await tx.event.update({ where: { id }, data: { status, currentVersion: { increment: 1 } } });
      await tx.workflowHistory.create({ data: { eventId: id, fromStatus: event.status, toStatus: status, action: data.type, actorId: req.user!.userId, actorRole: req.user!.role, actorName: req.user!.fullName, comments: data.facilityCondition } });
    });
    res.json({ success: true });
  } catch (error: any) { res.status(400).json({ error: error.message }); }
});

// Get event by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const event = await getEventById(id);
    if (!event || event.deletedAt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ' });
      return;
    }
    if (event.status === 'DRAFT' && event.createdById !== req.user!.userId && req.user!.role !== 'ADMIN') {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ' });
      return;
    }
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// Update event
router.put('/:id', authenticate, validate(createEventSchema.partial().extend({ changeNote: z.string().optional(), expectedVersion: z.number().int().positive().optional() })), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const updated = await updateEvent(id, req.body, req.user!.userId, req.user!.role);
    res.json({ success: true, data: updated });
  } catch (err: any) {
    const status = err instanceof EventEditAuthorizationError ? 403
      : err instanceof EventEditStatusError ? 409
        : err.message?.includes('đã được máy khác cập nhật') ? 409
          : 400;
    res.status(status).json({ success: false, error: err.message });
  }
});

// Submit event
router.post('/:id/submit', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await submitEvent(id, req.user!.userId, req.user!.role);
    res.json({ success: true, data: result, message: 'Đã nộp hồ sơ thành công' });
  } catch (err: any) {
    if (err instanceof EventSubmissionValidationError) {
      res.status(422).json({ success: false, error: err.message, data: err.issues });
      return;
    }
    res.status(err instanceof EventEditAuthorizationError ? 403 : 400).json({ success: false, error: err.message });
  }
});

// Review / Workflow transition
router.post('/:id/review', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { action, comments, reason } = req.body;
    if (!action) {
      res.status(400).json({ success: false, error: 'Thiếu hành động phê duyệt (action)' });
      return;
    }
    const result = await transitionState(
      id,
      action,
      req.user!.userId,
      req.user!.role,
      { comments, reason }
    );
    res.json({ success: true, data: result, message: `Thao tác "${action}" thành công` });
  } catch (err: any) {
    if (err instanceof EventSubmissionValidationError) {
      res.status(422).json({ success: false, error: err.message, data: err.issues });
      return;
    }
    res.status(err instanceof WorkflowAuthorizationError ? 403 : 400).json({ success: false, error: err.message });
  }
});

// Get available actions for current user
router.get('/:id/available-actions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const event = await getEventById(id);
    if (!event || event.deletedAt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ' });
      return;
    }
    const actions = getAvailableActions(event.status, req.user!.role, event.createdById, req.user!.userId);
    res.json({ success: true, data: actions });
  } catch (err) {
    next(err);
  }
});

// Get workflow history
router.get('/:id/history', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const history = await getEventHistory(id);
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
});


// Upload attachment
router.post('/:id/attachments', authenticate, async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: String(req.params.id) } });
    if (!event || event.deletedAt || (req.user!.role !== 'ADMIN' && (req.user!.role !== 'BTC' || event.createdById !== req.user!.userId))) {
      res.status(403).json({ error: 'Không có quyền tải tệp lên hồ sơ này' }); return;
    }
    if (!['DRAFT', 'FACULTY_REVISION_REQUESTED', 'UNIVERSITY_REVISION_REQUESTED', 'BUDGET_REVISION_REQUESTED', 'FACILITY_CONFLICT', 'FACILITY_REVISION_REQUESTED'].includes(event.status)) {
      res.status(409).json({ error: 'Chỉ được tải tệp lên hồ sơ đang ở trạng thái chỉnh sửa' }); return;
    }
    next();
  } catch (error) { next(error); }
}, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!req.file) {
      res.status(400).json({ success: false, error: 'Chưa chọn tệp tải lên' });
      return;
    }
    const category = z.enum(['TIMELINE', 'BUDGET', 'OTHER']).safeParse(req.body.category);
    if (!category.success) {
      res.status(400).json({ success: false, error: 'Loại tài liệu không hợp lệ' });
      return;
    }
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const stored = await saveAttachment(id, originalName, req.file.mimetype, req.file.buffer);
    try {
      const attachment = await prisma.attachment.create({
        data: {
          eventId: id,
          fileName: stored.fileName,
          originalName,
          fileType: req.file.mimetype,
          filePath: stored.filePath,
          fileSize: req.file.size,
          category: category.data,
          uploadedById: req.user!.userId,
        },
        include: { uploadedBy: { select: { id: true, fullName: true } } },
      });
      res.status(201).json({ success: true, data: attachment, message: 'Tải lên tài liệu thành công' });
    } catch (error) {
      await removeAttachment(stored.filePath);
      throw error;
    }
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id/attachments/:attachmentId', authenticate, async (req: Request, res: Response) => {
  try {
    const eventId = String(req.params.id);
    const attachmentId = Array.isArray(req.params.attachmentId) ? req.params.attachmentId[0] : req.params.attachmentId;
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    const event = attachment ? await prisma.event.findUnique({ where: { id: attachment.eventId } }) : null;
    if (!attachment || attachment.eventId !== eventId || !event || event.deletedAt) {
      res.status(404).json({ success: false, error: 'Không tìm thấy tệp đính kèm' });
      return;
    }
    if (req.user!.role !== 'ADMIN' && (req.user!.role !== 'BTC' || event.createdById !== req.user!.userId)) {
      res.status(403).json({ success: false, error: 'Không có quyền xóa tệp đính kèm này' });
      return;
    }
    if (!['DRAFT', 'FACULTY_REVISION_REQUESTED', 'UNIVERSITY_REVISION_REQUESTED', 'BUDGET_REVISION_REQUESTED', 'FACILITY_CONFLICT', 'FACILITY_REVISION_REQUESTED'].includes(event.status)) {
      res.status(409).json({ success: false, error: 'Chỉ được xóa tệp khi hồ sơ đang ở trạng thái chỉnh sửa' });
      return;
    }
    await removeAttachment(attachment.filePath);
    await prisma.attachment.delete({ where: { id: attachment.id } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Download attachment
router.get('/:id/attachments/:attachmentId/download', authenticate, async (req: Request, res: Response) => {
  try {
    const attachmentId = Array.isArray(req.params.attachmentId) ? req.params.attachmentId[0] : req.params.attachmentId;
    const attachment = await prisma.attachment.findUnique({ where: { id: attachmentId } });
    const event = attachment ? await prisma.event.findUnique({ where: { id: attachment.eventId } }) : null;
    // Match existing event visibility: all authenticated application roles can read non-deleted events.
    if (!attachment || attachment.eventId !== String(req.params.id) || !event || event.deletedAt ||
      (event.status === 'DRAFT' && event.createdById !== req.user!.userId && req.user!.role !== 'ADMIN')) {
      res.status(404).json({ success: false, error: 'Không tìm thấy tệp đính kèm' });
      return;
    }
    res.setHeader('Cache-Control', 'private, no-store');
    const inline = req.query.inline === 'true';
    const location = await resolveAttachment(attachment.filePath, !inline);
    if ('url' in location) { res.json({ success: true, url: location.url }); return; }
    if (inline) {
      res.type(attachment.fileType);
      res.sendFile(location.localPath);
    } else {
      res.download(location.localPath, attachment.originalName || attachment.fileName);
    }
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
