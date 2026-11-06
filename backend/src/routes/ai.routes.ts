import { Router, Request, Response, NextFunction } from 'express';
import {
  reviewApplication,
  suggestResources,
  generateReportDraft,
} from '../services/ai.service';
import { authenticate } from '../middleware/auth';

const router = Router();

// Review application
router.post('/review', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      res.status(400).json({ success: false, error: 'Thiếu eventId' });
      return;
    }
    const result = await reviewApplication(eventId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/analyze-event', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.body;
    if (typeof eventId !== 'string' || !eventId.trim()) {
      res.status(400).json({ success: false, error: 'Thiếu eventId hợp lệ' });
      return;
    }
    const result = await reviewApplication(eventId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Suggest resources
router.post('/resource-suggestions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { expectedAttendees, startTime, endTime } = req.body;
    if (!expectedAttendees || !startTime || !endTime) {
      res.status(400).json({ success: false, error: 'Thiếu thông tin người tham dự hoặc thời gian' });
      return;
    }
    const suggestions = await suggestResources(req.body);
    res.json({ success: true, data: suggestions });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Generate report draft
router.post('/generate-report', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.body;
    if (!eventId) {
      res.status(400).json({ success: false, error: 'Thiếu eventId' });
      return;
    }
    const draft = await generateReportDraft(eventId);
    res.json({ success: true, data: draft });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
