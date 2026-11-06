import { Router, Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
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

const facilityPayloadSchema = z.object({
  code: z.string().trim().min(1, 'Mã địa điểm không được để trống'),
  name: z.string().trim().min(1, 'Tên địa điểm không được để trống'),
  type: z.string().trim().min(1, 'Loại địa điểm không được để trống'),
  location: z.union([z.string(), z.null(), z.undefined()]).optional().transform((value) => value?.trim() || ''),
  capacity: z.preprocess(
    (value) => typeof value === 'string' && value.trim() ? Number(value) : value,
    z.number().int().positive('Sức chứa phải là số nguyên dương').nullable().optional()
  ),
  description: z.union([z.string(), z.null(), z.undefined()]).optional().transform((value) => value?.trim() || ''),
  amenities: z.union([
    z.array(z.string().trim().min(1)).optional(),
    z.string().optional(),
    z.null(),
  ]).optional().transform((value) => {
    if (!value) return '[]';
    if (Array.isArray(value)) return JSON.stringify(value.filter(Boolean));
    const normalized = value.trim();
    if (!normalized) return '[]';
    try {
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed) ? JSON.stringify(parsed.filter(Boolean)) : JSON.stringify([normalized]);
    } catch {
      return JSON.stringify(normalized.split(',').map((item) => item.trim()).filter(Boolean));
    }
  }),
});

const equipmentPayloadSchema = z.object({
  code: z.string().trim().min(1, 'Mã thiết bị không được để trống'),
  name: z.string().trim().min(1, 'Tên thiết bị không được để trống'),
  type: z.string().trim().min(1, 'Loại thiết bị không được để trống'),
  totalQuantity: z.preprocess(
    (value) => typeof value === 'string' && value.trim() ? Number(value) : value,
    z.number().int().positive('Số lượng thiết bị phải là số nguyên dương').default(1)
  ),
  description: z.union([z.string(), z.null(), z.undefined()]).optional().transform((value) => value?.trim() || ''),
  condition: z.string().trim().optional().default('GOOD'),
});

const facilityUpdateSchema = facilityPayloadSchema.partial();
const equipmentUpdateSchema = equipmentPayloadSchema.partial();
const facilityTypeSchema = z.object({
  name: z.string().trim().min(1, 'Tên loại cơ sở vật chất không được để trống').max(80),
});

const FACILITY_TYPE_SETTING_KEY = 'facility_type_catalog';
const DEFAULT_FACILITY_TYPES = [
  'Hội trường',
  'Phòng họp',
  'Phòng học',
  'Sân thể thao',
  'Không gian ngoài trời',
  'Phòng chức năng khác',
];

interface FacilityTypeRecord {
  id: string;
  name: string;
  isActive: boolean;
}

async function getFacilityTypeRecords(): Promise<FacilityTypeRecord[]> {
  const setting = await prisma.systemSetting.findUnique({ where: { key: FACILITY_TYPE_SETTING_KEY } });
  if (setting) {
    const parsed: unknown = JSON.parse(setting.value);
    return z.array(z.object({
      id: z.string().uuid(),
      name: z.string().min(1),
      isActive: z.boolean(),
    })).parse(parsed);
  }

  const existingFacilities = await prisma.facility.findMany({ select: { type: true }, distinct: ['type'] });
  const names = [...new Set([...DEFAULT_FACILITY_TYPES, ...existingFacilities.map((item) => item.type.trim()).filter(Boolean)])];
  const records = names.map((name) => ({ id: randomUUID(), name, isActive: true }));
  await prisma.systemSetting.upsert({
    where: { key: FACILITY_TYPE_SETTING_KEY },
    create: {
      key: FACILITY_TYPE_SETTING_KEY,
      value: JSON.stringify(records),
      description: 'Danh mục loại cơ sở vật chất',
      category: 'RESOURCE_CATALOG',
    },
    update: {},
  });
  return records;
}

const parseAmenityList = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [trimmed];
    } catch {
      return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
};

const handleFacilityList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.all === 'true';
    if (includeInactive && ![UserRole.ADMIN, UserRole.CSVC].includes(req.user?.role as UserRole)) {
      res.status(403).json({ success: false, error: 'Bạn không có quyền xem tài nguyên đã vô hiệu hóa' });
      return;
    }
    const facilities = await prisma.facility.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: facilities.map((facility) => ({
      ...facility,
      amenities: parseAmenityList(facility.amenities),
    })) });
  } catch (err) {
    next(err);
  }
};

const handleEquipmentList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.all === 'true';
    if (includeInactive && ![UserRole.ADMIN, UserRole.CSVC].includes(req.user?.role as UserRole)) {
      res.status(403).json({ success: false, error: 'Bạn không có quyền xem tài nguyên đã vô hiệu hóa' });
      return;
    }
    const equipment = await prisma.equipment.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: equipment });
  } catch (err) {
    next(err);
  }
};

const isResourceManager = (req: Request) =>
  req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CSVC;

// List facilities
router.get('/facilities', authenticate, handleFacilityList);
router.get('/equipment', authenticate, handleEquipmentList);

router.get('/facilities/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const facility = await prisma.facility.findUnique({ where: { id } });
    if (!facility || (!facility.isActive && !isResourceManager(req))) {
      res.status(404).json({ success: false, error: 'Không tìm thấy cơ sở vật chất' });
      return;
    }
    res.json({
      success: true,
      data: { ...facility, amenities: parseAmenityList(facility.amenities) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/facility-types', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeInactive = req.query.all === 'true';
    if (includeInactive && !isResourceManager(req)) {
      res.status(403).json({ success: false, error: 'Bạn không có quyền xem loại tài nguyên đã vô hiệu hóa' });
      return;
    }
    const types = await getFacilityTypeRecords();
    res.json({ success: true, data: types.filter((item) => includeInactive || item.isActive) });
  } catch (err) {
    next(err);
  }
});

router.post('/facility-types', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = facilityTypeSchema.parse(req.body);
    const types = await getFacilityTypeRecords();
    if (types.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      res.status(409).json({ success: false, error: 'Loại cơ sở vật chất đã tồn tại' });
      return;
    }
    const created = { id: randomUUID(), name, isActive: true };
    const updated = [...types, created];
    await prisma.systemSetting.update({
      where: { key: FACILITY_TYPE_SETTING_KEY },
      data: { value: JSON.stringify(updated) },
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

const updateFacilityType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { name } = facilityTypeSchema.parse(req.body);
    const types = await getFacilityTypeRecords();
    const current = types.find((item) => item.id === id);
    if (!current) {
      res.status(404).json({ success: false, error: 'Không tìm thấy loại cơ sở vật chất' });
      return;
    }
    if (types.some((item) => item.id !== id && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      res.status(409).json({ success: false, error: 'Loại cơ sở vật chất đã tồn tại' });
      return;
    }
    const updated = types.map((item) => item.id === id ? { ...item, name } : item);
    await prisma.$transaction([
      prisma.facility.updateMany({ where: { type: current.name }, data: { type: name } }),
      prisma.systemSetting.update({
        where: { key: FACILITY_TYPE_SETTING_KEY },
        data: { value: JSON.stringify(updated) },
      }),
    ]);
    res.json({ success: true, data: updated.find((item) => item.id === id) });
  } catch (err) {
    next(err);
  }
};

router.put('/facility-types/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), updateFacilityType);
router.patch('/facility-types/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), updateFacilityType);

const setFacilityTypeActive = async (req: Request, res: Response, next: NextFunction, isActive: boolean) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const types = await getFacilityTypeRecords();
    if (!types.some((item) => item.id === id)) {
      res.status(404).json({ success: false, error: 'Không tìm thấy loại cơ sở vật chất' });
      return;
    }
    const updated = types.map((item) => item.id === id ? { ...item, isActive } : item);
    await prisma.systemSetting.update({
      where: { key: FACILITY_TYPE_SETTING_KEY },
      data: { value: JSON.stringify(updated) },
    });
    res.json({ success: true, data: updated.find((item) => item.id === id) });
  } catch (err) {
    next(err);
  }
};

router.delete('/facility-types/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), (req, res, next) => {
  void setFacilityTypeActive(req, res, next, false);
});
router.patch('/facility-types/:id/restore', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), (req, res, next) => {
  void setFacilityTypeActive(req, res, next, true);
});

router.get('/equipment/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await prisma.equipment.findUnique({ where: { id } });
    if (!item || (!item.isActive && !isResourceManager(req))) {
      res.status(404).json({ success: false, error: 'Không tìm thấy thiết bị' });
      return;
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

router.post('/facilities', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = facilityPayloadSchema.parse(req.body);
    const types = await getFacilityTypeRecords();
    if (!types.some((item) => item.name === payload.type && item.isActive)) {
      res.status(400).json({ success: false, error: 'Loại cơ sở vật chất không tồn tại hoặc đã bị vô hiệu hóa' });
      return;
    }
    const facility = await prisma.facility.create({
      data: {
        code: payload.code,
        name: payload.name,
        type: payload.type,
        location: payload.location || null,
        capacity: payload.capacity,
        description: payload.description || null,
        amenities: payload.amenities || '[]',
        isActive: true,
      },
    });
    res.status(201).json({
      success: true,
      data: { ...facility, amenities: parseAmenityList(facility.amenities) },
    });
  } catch (err) {
    next(err);
  }
});

const updateFacility = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const payload = facilityUpdateSchema.parse(req.body);
    const existing = await prisma.facility.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Không tìm thấy cơ sở vật chất' });
      return;
    }
    if (payload.type !== undefined && payload.type !== existing.type) {
      const types = await getFacilityTypeRecords();
      if (!types.some((item) => item.name === payload.type && item.isActive)) {
        res.status(400).json({ success: false, error: 'Loại cơ sở vật chất không tồn tại hoặc đã bị vô hiệu hóa' });
        return;
      }
    }
    const facility = await prisma.facility.update({
      where: { id },
      data: {
        ...(payload.code !== undefined && { code: payload.code }),
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.type !== undefined && { type: payload.type }),
        ...(payload.location !== undefined && { location: payload.location || null }),
        ...(payload.capacity !== undefined && { capacity: payload.capacity }),
        ...(payload.description !== undefined && { description: payload.description || null }),
        ...(payload.amenities !== undefined && { amenities: payload.amenities }),
      },
    });
    res.json({ success: true, data: { ...facility, amenities: parseAmenityList(facility.amenities) } });
  } catch (err) {
    next(err);
  }
};

router.put('/facilities/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), updateFacility);
router.patch('/facilities/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), updateFacility);

router.patch('/facilities/:id/toggle', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const facility = await prisma.facility.findUnique({ where: { id } });
    if (!facility) {
      res.status(404).json({ success: false, error: 'Không tìm thấy địa điểm' });
      return;
    }
    const updated = await prisma.facility.update({
      where: { id },
      data: { isActive: !facility.isActive },
    });
    res.json({ success: true, data: updated, message: updated.isActive ? 'Đã kích hoạt lại địa điểm' : 'Đã vô hiệu hóa địa điểm' });
  } catch (err) {
    next(err);
  }
});

router.patch('/facilities/:id/restore', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const facility = await prisma.facility.update({ where: { id }, data: { isActive: true } });
    res.json({
      success: true,
      data: { ...facility, amenities: parseAmenityList(facility.amenities) },
      message: 'Đã khôi phục cơ sở vật chất',
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/facilities/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const facility = await prisma.facility.findUnique({ where: { id } });
    if (!facility) {
      res.status(404).json({ success: false, error: 'Không tìm thấy địa điểm' });
      return;
    }
    const updated = await prisma.facility.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Đã chuyển địa điểm sang trạng thái vô hiệu hóa', data: updated });
  } catch (err) {
    next(err);
  }
});

router.post('/equipment', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = equipmentPayloadSchema.parse(req.body);
    const item = await prisma.equipment.create({
      data: {
        code: payload.code,
        name: payload.name,
        type: payload.type,
        totalQuantity: payload.totalQuantity,
        description: payload.description || null,
        condition: payload.condition || 'GOOD',
        isActive: true,
      },
    });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
});

const updateEquipment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const payload = equipmentUpdateSchema.parse(req.body);
    const item = await prisma.equipment.update({
      where: { id },
      data: {
        ...(payload.code !== undefined && { code: payload.code }),
        ...(payload.name !== undefined && { name: payload.name }),
        ...(payload.type !== undefined && { type: payload.type }),
        ...(payload.totalQuantity !== undefined && { totalQuantity: payload.totalQuantity }),
        ...(payload.description !== undefined && { description: payload.description || null }),
        ...(payload.condition !== undefined && { condition: payload.condition || 'GOOD' }),
      },
    });
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

router.put('/equipment/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), updateEquipment);
router.patch('/equipment/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), updateEquipment);

router.patch('/equipment/:id/toggle', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await prisma.equipment.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ success: false, error: 'Không tìm thấy thiết bị' });
      return;
    }
    const updated = await prisma.equipment.update({
      where: { id },
      data: { isActive: !item.isActive },
    });
    res.json({ success: true, data: updated, message: updated.isActive ? 'Đã kích hoạt lại thiết bị' : 'Đã vô hiệu hóa thiết bị' });
  } catch (err) {
    next(err);
  }
});

router.patch('/equipment/:id/restore', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await prisma.equipment.update({ where: { id }, data: { isActive: true } });
    res.json({ success: true, data: item, message: 'Đã khôi phục thiết bị' });
  } catch (err) {
    next(err);
  }
});

router.delete('/equipment/:id', authenticate, authorize(UserRole.CSVC, UserRole.ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const item = await prisma.equipment.findUnique({ where: { id } });
    if (!item) {
      res.status(404).json({ success: false, error: 'Không tìm thấy thiết bị' });
      return;
    }
    const updated = await prisma.equipment.update({
      where: { id },
      data: { isActive: false },
    });
    res.json({ success: true, message: 'Đã chuyển thiết bị sang trạng thái vô hiệu hóa', data: updated });
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
router.post('/', authenticate, authorize(UserRole.BTC), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const booking = await createBooking(req.body, req.user!.userId);
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
router.get('/facilities/:id/calendar', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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
