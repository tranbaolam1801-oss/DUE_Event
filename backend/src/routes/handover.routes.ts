import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import {
  createHandoverRecord,
  createReturnInspection,
  createIncidentReport,
} from '../services/handover.service';
import { authenticate } from '../middleware/auth';

const router = Router();

// Create handover record
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const record = await createHandoverRecord({
      ...req.body,
      handoverById: req.user!.userId,
    });
    res.status(201).json({ success: true, data: record, message: 'Đã lưu biên bản bàn giao' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Create return inspection
router.post('/inspection', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inspection = await createReturnInspection({
      ...req.body,
      inspectedById: req.user!.userId,
    });
    res.status(201).json({ success: true, data: inspection, message: 'Đã lưu kết quả kiểm tra hoàn trả' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Create incident report
router.post('/incident', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incident = await createIncidentReport({
      ...req.body,
      reportedById: req.user!.userId,
    });
    res.status(201).json({ success: true, data: incident, message: 'Đã lập biên bản sự cố' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get records by eventId
router.get('/:eventId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = Array.isArray(req.params.eventId) ? req.params.eventId[0] : req.params.eventId;
    const [handovers, inspections, incidents] = await Promise.all([
      prisma.handoverRecord.findMany({
        where: { eventId },
        include: {
          handoverBy: { select: { id: true, fullName: true, role: true } },
          receivedBy: { select: { id: true, fullName: true, role: true } },
        },
      }),
      prisma.returnInspection.findMany({
        where: { eventId },
        include: { inspectedBy: { select: { id: true, fullName: true, role: true } } },
      }),
      prisma.incidentReport.findMany({
        where: { eventId },
        include: { reportedBy: { select: { id: true, fullName: true, role: true } } },
      }),
    ]);

    res.json({ success: true, data: { handovers, inspections, incidents } });
  } catch (err) {
    next(err);
  }
});

export default router;
