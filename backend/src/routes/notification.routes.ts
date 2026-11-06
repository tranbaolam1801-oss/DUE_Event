import { Router, Request, Response, NextFunction } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
} from '../services/notification.service';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, isRead } = req.query;
    const result = await getNotifications(req.user!.userId, {
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await markAsRead(id, req.user!.userId);
    res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  } catch (err) {
    next(err);
  }
});

router.put('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await markAllAsRead(req.user!.userId);
    res.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (err) {
    next(err);
  }
});

router.get('/unread-count', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await getUnreadCount(req.user!.userId);
    res.json({ success: true, data: { unreadCount: count } });
  } catch (err) {
    next(err);
  }
});

export default router;
