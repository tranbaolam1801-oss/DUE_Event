import { z } from 'zod';

const optionalText = z.string().trim().optional();

export const bookingSchema = z.object({
  facilityId: z.string().trim().min(1, 'Vui lòng chọn địa điểm tổ chức'),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  setupTime: z.string().datetime().optional(),
  teardownTime: z.string().datetime().optional(),
  equipmentItems: z.array(
    z.object({
      equipmentId: z.string().trim().min(1, 'Vui lòng chọn thiết bị hợp lệ'),
      quantity: z.number().int().positive('Số lượng thiết bị phải lớn hơn 0'),
    })
  ).optional(),
});

const budgetItemSchema = z.object({
  category: z.string().trim().min(1, 'Vui lòng chọn nhóm chi phí'),
  itemName: z.string().trim().min(1, 'Vui lòng nhập tên khoản chi'),
  quantity: z.number().int().positive('Số lượng phải là số nguyên lớn hơn 0'),
  unitPrice: z.number().finite().nonnegative('Đơn giá phải là số không âm'),
  notes: z.string().nullable().optional(),
}).superRefine((item, context) => {
  const lineTotal = item.quantity * item.unitPrice;
  if (!Number.isFinite(lineTotal) || Math.abs(lineTotal) > Number.MAX_SAFE_INTEGER) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['unitPrice'],
      message: 'Thành tiền vượt quá giới hạn số tiền hỗ trợ',
    });
  }
});

const budgetItemsSchema = z.array(budgetItemSchema).superRefine((items, context) => {
  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  if (!Number.isFinite(total) || Math.abs(total) > Number.MAX_SAFE_INTEGER) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Tổng dự toán vượt quá giới hạn số tiền hỗ trợ',
    });
  }
});

export const createEventSchema = z.object({
  booking: bookingSchema.nullable().optional(),
  title: z.string({ required_error: 'Vui lòng nhập tên sự kiện' }).trim().min(1, 'Vui lòng nhập tên sự kiện'),
  description: optionalText,
  objectives: optionalText,
  targetAudience: optionalText,
  expectedAttendees: z.number().int().positive('Số người tham dự phải lớn hơn 0').optional(),
  organizingUnit: z.string({ required_error: 'Vui lòng nhập đơn vị tổ chức' }).trim().min(1, 'Vui lòng nhập đơn vị tổ chức'),
  contactPerson: optionalText,
  contactEmail: z.union([
    z.string().trim().email('Email liên hệ không hợp lệ'),
    z.literal(''),
  ]).optional(),
  contactPhone: optionalText,
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  setupTime: z.string().datetime().optional(),
  teardownTime: z.string().datetime().optional(),
  preferredVenue: optionalText,
  budgetItems: budgetItemsSchema.optional(),
  scheduleItems: z.array(z.object({
    timeSlot: z.string(),
    activity: z.string(),
    responsible: z.string().optional(),
    notes: z.string().optional(),
    sortOrder: z.number().optional(),
  })).optional(),
});
