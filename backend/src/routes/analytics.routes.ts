import { Router, Request, Response, NextFunction } from 'express';
import {
  getDashboardStats,
  getWorkflowBottlenecks,
  getApprovalRates,
  getProcessingTimes,
  getBudgetAnalysis,
  getResourceUtilization,
} from '../services/analytics.service';
import { authenticate } from '../middleware/auth';
import prisma from '../config/database';

const router = Router();

router.get('/workflow-bottlenecks', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: await getWorkflowBottlenecks() });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await getDashboardStats(req.user!.role, req.user!.userId);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

router.get('/approvals', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rates = await getApprovalRates();
    res.json({ success: true, data: rates });
  } catch (err) {
    next(err);
  }
});

router.get('/processing-times', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const times = await getProcessingTimes();
    res.json({ success: true, data: times });
  } catch (err) {
    next(err);
  }
});

router.get('/budget', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const budget = await getBudgetAnalysis();
    res.json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
});

router.get('/resources', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const resources = await getResourceUtilization();
    res.json({ success: true, data: resources });
  } catch (err) {
    next(err);
  }
});

router.get('/export', authenticate, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const events = await prisma.event.findMany({
      where: { deletedAt: null },
      include: { budgetItems: true },
    });

    const headers = ['Mã sự kiện', 'Tên sự kiện', 'Đơn vị', 'Trạng thái', 'Ngày bắt đầu', 'Tổng dự toán'];
    const rows = events.map((e) => [
      e.eventCode,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.organizingUnit.replace(/"/g, '""')}"`,
      e.status,
      e.startDate ? e.startDate.toISOString() : '',
      e.budgetItems.reduce((s, i) => s + i.totalPrice, 0),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=eventflow_report.csv');
    res.send(csvContent);
  } catch (err) {
    next(err);
  }
});

export default router;
