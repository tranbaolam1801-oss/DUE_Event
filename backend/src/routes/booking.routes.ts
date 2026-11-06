import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import {
  checkAvailability,
  createBooking,
  confirmBooking,
  rejectBooking,
  getBookingsForFacility,
  getAllBookings,
} from '../services/booking.service';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types';

const router = Router();

// List facilities
router.get('/facilities', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const facilities = await prisma.facility.findMany({ where: { isActive: true } });
    res.json({ success: true, data: facilities });
  } catch (err) {
    next(err);
  }
});

// List equipment
router.get('/equipment', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const equipment = await prisma.equipment.findMany({ where: { isActive: true } });
    res.json({ success: true, data: equipment });
  } catch (err) {
    next(err);
  }
});

// List bookings
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, eventId } = req.query;
    const bookings = await getAllBookings({
      status: status as string,
      eventId: eventId as string,
    });
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});

// Check availability
router.get('/availability', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facilityId, startTime, endTime } = req.query;
    if (!facilityId || !startTime || !endTime) {
      res.status(400).json({ success: false, error: 'Thiếu tham số facilityId, startTime, endTime' });
      return;
    }
    const conflicts = await checkAvailability(
      facilityId as string,
      new Date(startTime as string),
      new Date(endTime as string)
    );
    res.json({ success: true, isAvailable: conflicts.length === 0, conflicts });
  } catch (err) {
    next(err);
  }
});

router.post('/check-conflict', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { facilityId, startTime, endTime, excludeBookingId } = z.object({
      facilityId: z.string().trim().min(1),
      startTime: z.string().datetime(),
      endTime: z.string().datetime(),
      excludeBookingId: z.string().optional(),
    }).parse(req.body);
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      res.status(400).json({ success: false, error: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
      return;
    }
    const conflictingBookings = await checkAvailability(facilityId, start, end, excludeBookingId);
    res.json({ success: true, conflict: conflictingBookings.length > 0, conflictingBookings });
  } catch (err) {
    next(err);
  }
});

// Create booking
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await createBooking(req.body);
    res.status(201).json({ success: true, data: booking });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Confirm booking (CSVC or ADMIN)
router.put('/:id/confirm', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const confirmed = await confirmBooking(id, req.user!.userId);
    res.json({ success: true, data: confirmed, message: 'Đã phê duyệt đặt chỗ CSVC' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Reject booking (CSVC or ADMIN)
router.put('/:id/reject', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const rejected = await rejectBooking(id, req.user!.userId);
    res.json({ success: true, data: rejected, message: 'Đã từ chối đặt chỗ' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Get calendar for a facility
router.get('/facilities/:id/calendar', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 86400000);
    const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 60 * 86400000);
    const bookings = await getBookingsForFacility(id, start, end);
    res.json({ success: true, data: bookings });
  } catch (err) {
    next(err);
  }
});

export default router;
