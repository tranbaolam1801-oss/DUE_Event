import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { UserRole, EventStatus } from '../types';
import { generateEventCode } from '../utils/generateCode';
import { createNotification } from './notification.service';
import { EventSubmissionValidationError, validateEventSubmission } from './eventSubmissionValidation';
import { canEditEvent, isEditableEventStatus } from './eventEditPolicy';

export const eventInclude = {
      createdBy: {
        select: { id: true, fullName: true, email: true, role: true, department: true },
      },
      budgetItems: { orderBy: { createdAt: 'asc' } },
      scheduleItems: { orderBy: { sortOrder: 'asc' } },
      approvalDecisions: {
        include: {
          decidedBy: { select: { id: true, fullName: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      workflowHistory: { orderBy: { createdAt: 'desc' } },
      attachments: {
        include: {
          uploadedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      resourceBookings: {
        include: {
          facility: true,
          bookingItems: { include: { equipment: true } },
        },
      },
      handoverRecords: {
        include: {
          handoverBy: { select: { id: true, fullName: true } },
          receivedBy: { select: { id: true, fullName: true } },
        },
      },
      returnInspections: {
        include: {
          inspectedBy: { select: { id: true, fullName: true } },
        },
      },
      incidentReports: {
        include: {
          reportedBy: { select: { id: true, fullName: true } },
        },
      },
      settlements: {
        include: {
          items: true,
          documents: true,
          submittedBy: { select: { id: true, fullName: true } },
          reviewedBy: { select: { id: true, fullName: true } },
        },
      },
      eventReport: true,
      versions: { orderBy: { version: 'desc' } },
    } satisfies Prisma.EventInclude;

export class EventCreateIdempotencyConflictError extends Error {
  constructor() {
    super('Yêu cầu này đã lưu một bản nháp khác. Không tạo hồ sơ trùng; hãy tải lại hồ sơ đã lưu trước khi tiếp tục.');
    this.name = 'EventCreateIdempotencyConflictError';
  }
}

export class EventEditAuthorizationError extends Error {
  constructor(message = 'Không có quyền chỉnh sửa hồ sơ này') {
    super(message);
    this.name = 'EventEditAuthorizationError';
  }
}

export class EventEditStatusError extends Error {
  constructor() {
    super('Không thể chỉnh sửa hồ sơ ở trạng thái hiện tại');
    this.name = 'EventEditStatusError';
  }
}

type EventBookingInput = {
  facilityId: string;
  startTime: string;
  endTime: string;
  setupTime?: string;
  teardownTime?: string;
  equipmentItems?: Array<{ equipmentId: string; quantity: number }>;
};

const activeBookingStatuses = ['PENDING', 'CONFIRMED', 'TENTATIVE', 'CONFLICT'];

async function validateEventBooking(
  tx: Prisma.TransactionClient,
  booking: EventBookingInput,
  expectedAttendees?: number,
  excludeEventId?: string,
  eventStart?: Date | null,
  eventEnd?: Date | null
) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  if (start < new Date(Date.now() - 5 * 60 * 1000)) {
    throw new Error('Thời gian đăng ký cơ sở vật chất không được ở trong quá khứ');
  }
  if (start.getTime() === end.getTime()) {
    throw new Error('Giờ kết thúc không được trùng với giờ bắt đầu');
  }
  if (!(start < end)) throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
  if ((eventStart && eventStart < start) || (eventEnd && eventEnd > end)) {
    throw new Error('Thời gian đặt cơ sở vật chất phải bao phủ toàn bộ thời gian sự kiện');
  }

  const facility = await tx.facility.findUnique({ where: { id: booking.facilityId } });
  if (!facility?.isActive) throw new Error('Địa điểm được chọn không tồn tại hoặc tạm ngưng hoạt động');
  if (facility.capacity && (expectedAttendees || 0) > facility.capacity) {
    throw new Error(`Số người tham dự (${expectedAttendees}) vượt quá sức chứa tối đa của ${facility.name} (${facility.capacity} chỗ)`);
  }

  const overlap = {
    status: { in: activeBookingStatuses },
    startTime: { lt: end },
    endTime: { gt: start },
    ...(excludeEventId ? { eventId: { not: excludeEventId } } : {}),
  };
  if (await tx.resourceBooking.count({ where: { facilityId: booking.facilityId, ...overlap } })) {
    throw new Error('Địa điểm đã có sự kiện đăng ký trong khung giờ này. Vui lòng chọn khung giờ khác.');
  }

  for (const item of booking.equipmentItems || []) {
    const equipment = await tx.equipment.findUnique({ where: { id: item.equipmentId } });
    const used = await tx.resourceBookingItem.aggregate({
      where: {
        equipmentId: item.equipmentId,
        booking: overlap,
      },
      _sum: { quantity: true },
    });
    if (!equipment?.isActive || (used._sum?.quantity || 0) + item.quantity > equipment.totalQuantity) {
      throw new Error('Thiết bị không đủ số lượng');
    }
  }
}

export async function createEvent(data: {
  title: string;
  description?: string;
  objectives?: string;
  targetAudience?: string;
  expectedAttendees?: number;
  organizingUnit: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  startDate?: string;
  endDate?: string;
  setupTime?: string;
  teardownTime?: string;
  preferredVenue?: string;
  budgetItems?: Array<{
    category: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
  scheduleItems?: Array<{
    timeSlot: string;
    activity: string;
    responsible?: string;
    notes?: string;
    sortOrder?: number;
  }>;
  booking?: EventBookingInput | null;
}, userId: string, legacy?: { key: string; snapshot: string }, requestId?: string) {
  const eventCode = await generateEventCode();
  const idempotencySettingKey = requestId ? `create-event:${userId}:${requestId}` : undefined;
  const requestFingerprint = requestId
    ? createHash('sha256').update(JSON.stringify(data)).digest('hex')
    : undefined;

  let event: { id: string };
  try {
    event = await prisma.$transaction(async (tx) => {
    if (idempotencySettingKey && requestFingerprint) {
      const previousRequest = await tx.systemSetting.findUnique({ where: { key: idempotencySettingKey } });
      if (previousRequest) {
        const previous = JSON.parse(previousRequest.value) as { eventId?: string; fingerprint?: string };
        if (previous.fingerprint !== requestFingerprint || !previous.eventId) {
          throw new EventCreateIdempotencyConflictError();
        }
        return { id: previous.eventId };
      }
    }

    if (legacy) {
      const existing = await tx.systemSetting.findUnique({ where: { key: legacy.key } });
      if (existing) return { id: JSON.parse(existing.value).eventId };
    }
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const now = new Date(Date.now() - 5 * 60 * 1000); // 5 phút dung sai
      if (start < now) {
        throw new Error('Thời gian bắt đầu không được ở trong quá khứ');
      }
      if (end < now) {
        throw new Error('Thời gian kết thúc không được ở trong quá khứ');
      }
      if (start.getTime() === end.getTime()) {
        throw new Error('Giờ kết thúc không được trùng với giờ bắt đầu');
      }
      if (start > end) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
    }
    if (data.booking) {
      await validateEventBooking(
        tx,
        data.booking,
        data.expectedAttendees,
        undefined,
        data.startDate ? new Date(data.startDate) : null,
        data.endDate ? new Date(data.endDate) : null
      );
    }
    const created = await tx.event.create({
      data: {
        eventCode,
        title: data.title,
        description: data.description,
        objectives: data.objectives,
        targetAudience: data.targetAudience,
        expectedAttendees: data.expectedAttendees,
        organizingUnit: data.organizingUnit,
        contactPerson: data.contactPerson,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        setupTime: data.setupTime ? new Date(data.setupTime) : undefined,
        teardownTime: data.teardownTime ? new Date(data.teardownTime) : undefined,
        preferredVenue: data.preferredVenue,
        status: EventStatus.DRAFT,
        createdById: userId,
      },
    });

    if (data.budgetItems?.length) {
      await tx.budgetItem.createMany({
        data: data.budgetItems.map((item) => ({
          eventId: created.id,
          category: item.category,
          itemName: item.itemName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          notes: item.notes,
        })),
      });
    }

    if (data.scheduleItems?.length) {
      await tx.eventScheduleItem.createMany({
        data: data.scheduleItems.map((item, index) => ({
          eventId: created.id,
          timeSlot: item.timeSlot,
          activity: item.activity,
          responsible: item.responsible,
          notes: item.notes,
          sortOrder: item.sortOrder ?? index,
        })),
      });
    }

    if (data.booking) {
      const b = data.booking;
      await tx.resourceBooking.create({ data: {
        eventId: created.id, facilityId: b.facilityId,
        startTime: new Date(b.startTime), endTime: new Date(b.endTime),
        setupTime: b.setupTime ? new Date(b.setupTime) : undefined,
        teardownTime: b.teardownTime ? new Date(b.teardownTime) : undefined,
        bookingItems: { create: (b.equipmentItems || []).map(i => ({ equipmentId: i.equipmentId, quantity: i.quantity })) },
      } });
    }
    if (idempotencySettingKey && requestFingerprint) {
      await tx.systemSetting.create({
        data: {
          key: idempotencySettingKey,
          category: 'EVENT_CREATE_IDEMPOTENCY',
          value: JSON.stringify({ eventId: created.id, fingerprint: requestFingerprint }),
        },
      });
    }
    if (legacy) await tx.systemSetting.create({ data: {
      key: legacy.key, category: 'LEGACY_BACKUP', value: JSON.stringify({ eventId: created.id, snapshot: legacy.snapshot }),
    } });
    // Create initial version
    await tx.eventVersion.create({
      data: {
        eventId: created.id,
        version: 1,
        title: created.title,
        description: created.description,
        objectives: created.objectives,
        planContent: created.planContent,
        changedBy: userId,
        changeNote: 'Khởi tạo hồ sơ',
      },
    });

    // Create workflow history
    await tx.workflowHistory.create({
      data: {
        eventId: created.id,
        fromStatus: '',
        toStatus: EventStatus.DRAFT,
        action: 'CREATE',
        actorId: userId,
        actorName: (await tx.user.findUnique({ where: { id: userId } }))?.fullName,
        actorRole: (await tx.user.findUnique({ where: { id: userId } }))?.role,
        comments: 'Tạo hồ sơ sự kiện mới',
      },
    });

    return created;
    });
  } catch (error) {
    if (error instanceof EventCreateIdempotencyConflictError) throw error;
    const isUniqueConflict = !!error && typeof error === 'object' && 'code' in error && error.code === 'P2002';
    if (!idempotencySettingKey || !requestFingerprint || !isUniqueConflict) throw error;

    const committedRequest = await prisma.systemSetting.findUnique({ where: { key: idempotencySettingKey } });
    if (!committedRequest) throw error;
    const committed = JSON.parse(committedRequest.value) as { eventId?: string; fingerprint?: string };
    if (committed.fingerprint !== requestFingerprint || !committed.eventId) {
      throw new EventCreateIdempotencyConflictError();
    }
    event = { id: committed.eventId };
  }

  return getEventById(event.id);
}

export async function getEvents(filters: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  deletedOnly?: boolean;
}, userId: string, role: string) {
  const { status, search, page = 1, limit = 20, deletedOnly = false } = filters;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { deletedAt: deletedOnly ? { not: null } : null };

  // Synchronized view across all roles
  // All roles can see events to track workflow progress

  if (role !== 'ADMIN') {
    where.AND = [{ OR: [{ status: { not: EventStatus.DRAFT } }, { createdById: userId }] }];
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { eventCode: { contains: search } },
      { organizingUnit: { contains: search } },
    ];
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function softDeleteEvent(id: string, adminId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({
      where: { id },
      include: { resourceBookings: true },
    });
    if (!event) throw new Error('Không tìm thấy hồ sơ');
    if (event.deletedAt) throw new Error('Hồ sơ đã được xóa trước đó');

    const now = new Date();
    const activeBookings = event.resourceBookings.filter((booking) =>
      ['PENDING', 'TENTATIVE', 'CONFIRMED', 'CONFLICT'].includes(booking.status)
    );
    if (activeBookings.some((booking) => booking.startTime <= now && booking.endTime > now)) {
      throw new Error('Không thể xóa hồ sơ khi lịch đặt cơ sở vật chất đang diễn ra');
    }

    const releasedBookings = await tx.resourceBooking.updateMany({
      where: {
        eventId: id,
        status: { in: ['PENDING', 'TENTATIVE', 'CONFIRMED', 'CONFLICT'] },
        startTime: { gt: now },
      },
      data: { status: 'RELEASED' },
    });
    const deletedAt = now;
    await tx.event.update({
      where: { id },
      data: { deletedAt, deletedById: adminId, deleteReason: reason },
    });
    await tx.workflowHistory.create({
      data: {
        eventId: id,
        fromStatus: event.status,
        toStatus: event.status,
        action: 'ADMIN_SOFT_DELETE',
        actorId: adminId,
        comments: reason,
        metadata: JSON.stringify({ deletedAt: deletedAt.toISOString(), releasedBookings: releasedBookings.count }),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'EVENT_SOFT_DELETE',
        entityType: 'Event',
        entityId: id,
        oldValue: JSON.stringify({ status: event.status, deletedAt: null }),
        newValue: JSON.stringify({ deletedAt: deletedAt.toISOString(), deleteReason: reason }),
      },
    });
    return { id, deletedAt, deletedById: adminId, deleteReason: reason };
  });
}

export async function restoreEvent(id: string, adminId: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id } });
    if (!event || !event.deletedAt) throw new Error('Không tìm thấy hồ sơ đã xóa');

    await tx.event.update({
      where: { id },
      data: { deletedAt: null, deletedById: null, deleteReason: null },
    });
    await tx.workflowHistory.create({
      data: {
        eventId: id,
        fromStatus: event.status,
        toStatus: event.status,
        action: 'ADMIN_RESTORE',
        actorId: adminId,
        comments: reason,
        metadata: JSON.stringify({
          deletedAt: event.deletedAt.toISOString(),
          deletedById: event.deletedById,
          deleteReason: event.deleteReason,
        }),
      },
    });
    await tx.auditLog.create({
      data: {
        userId: adminId,
        action: 'EVENT_RESTORE',
        entityType: 'Event',
        entityId: id,
        oldValue: JSON.stringify({
          deletedAt: event.deletedAt.toISOString(),
          deletedById: event.deletedById,
          deleteReason: event.deleteReason,
        }),
        newValue: JSON.stringify({ restoredAt: new Date().toISOString(), reason }),
      },
    });
    return { id, restored: true };
  });
}

export async function getEventById(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: eventInclude,
  });

  return event;
}

export async function updateEvent(id: string, data: Record<string, unknown>, userId: string, userRole?: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      budgetItems: true,
      scheduleItems: true,
      resourceBookings: { include: { bookingItems: true } },
      attachments: { select: { id: true, originalName: true, category: true, filePath: true } },
    },
  });
  if (!event || event.deletedAt) throw new Error('Không tìm thấy hồ sơ');

  if (userRole !== UserRole.ADMIN && !isEditableEventStatus(event.status)) {
    throw new EventEditStatusError();
  }

  if (!canEditEvent(event.status, event.createdById, userId, userRole || '')) {
    throw new EventEditAuthorizationError();
  }
  if (userRole === UserRole.ADMIN && !String(data.changeNote || '').trim()) {
    throw new Error('Quản trị viên phải ghi lý do khi chỉnh sửa hoặc mở lại hồ sơ');
  }

  const startVal = data.startDate !== undefined ? data.startDate : event.startDate;
  const endVal = data.endDate !== undefined ? data.endDate : event.endDate;
  if (startVal && endVal) {
    const start = new Date(startVal as string | Date);
    const end = new Date(endVal as string | Date);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      if (start.getTime() === end.getTime()) {
        throw new Error('Giờ kết thúc không được trùng với giờ bắt đầu');
      }
      if (start > end) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
    }
  }

  const fields = ['title', 'description', 'objectives', 'targetAudience', 'expectedAttendees', 'organizingUnit', 'contactPerson', 'contactEmail', 'contactPhone', 'preferredVenue'];
  const patch: Record<string, any> = {};
  for (const key of fields) if (data[key] !== undefined) patch[key] = data[key];
  for (const key of ['startDate', 'endDate', 'setupTime', 'teardownTime']) {
    if (data[key] !== undefined) patch[key] = data[key] ? new Date(data[key] as string) : null;
  }
  await prisma.$transaction(async tx => {
    const changed = await tx.event.updateMany({ where: { id, currentVersion: Number(data.expectedVersion ?? event.currentVersion), status: event.status }, data: { ...patch, currentVersion: { increment: 1 } } });
    if (!changed.count) throw new Error('Hồ sơ đã được máy khác cập nhật. Tải lại trang trước khi sửa tiếp.');
    if (Array.isArray(data.budgetItems)) {
      await tx.budgetItem.deleteMany({ where: { eventId: id } });
      await tx.budgetItem.createMany({ data: data.budgetItems.map((i: any) => ({ eventId: id, category: i.category, itemName: i.itemName, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.quantity * i.unitPrice, notes: i.notes })) });
    }
    if (Array.isArray(data.scheduleItems)) {
      await tx.eventScheduleItem.deleteMany({ where: { eventId: id } });
      await tx.eventScheduleItem.createMany({ data: data.scheduleItems.map((i: any, index: number) => ({ eventId: id, timeSlot: i.timeSlot, activity: i.activity, responsible: i.responsible, notes: i.notes, sortOrder: index })) });
    }
    if (data.booking !== undefined) {
      const currentBooking = await tx.resourceBooking.findFirst({
        where: { eventId: id, status: { in: [...activeBookingStatuses, 'CONFLICT'] } },
        orderBy: { updatedAt: 'desc' },
      });

      if (data.booking === null) {
        if (currentBooking) {
          await tx.resourceBooking.update({ where: { id: currentBooking.id }, data: { status: 'REJECTED' } });
        }
      } else if (data.booking !== undefined) {
        const booking = data.booking as EventBookingInput;
        await validateEventBooking(
          tx,
          booking,
          Number(data.expectedAttendees ?? event.expectedAttendees) || undefined,
          id,
          startVal ? new Date(startVal as string | Date) : null,
          endVal ? new Date(endVal as string | Date) : null
        );
        const bookingData = {
          facilityId: booking.facilityId,
          startTime: new Date(booking.startTime),
          endTime: new Date(booking.endTime),
          setupTime: booking.setupTime ? new Date(booking.setupTime) : null,
          teardownTime: booking.teardownTime ? new Date(booking.teardownTime) : null,
        };
        const savedBooking = currentBooking
          ? await tx.resourceBooking.update({ where: { id: currentBooking.id }, data: bookingData })
          : await tx.resourceBooking.create({ data: { eventId: id, ...bookingData } });

        await tx.resourceBookingItem.deleteMany({ where: { bookingId: savedBooking.id } });
        if (booking.equipmentItems?.length) {
          await tx.resourceBookingItem.createMany({
            data: booking.equipmentItems.map((item) => ({
              bookingId: savedBooking.id,
              equipmentId: item.equipmentId,
              quantity: item.quantity,
            })),
          });
        }
      } else if (currentBooking && (
        data.expectedAttendees !== undefined ||
        data.startDate !== undefined ||
        data.endDate !== undefined
      )) {
        await validateEventBooking(
          tx,
          {
            facilityId: currentBooking.facilityId,
            startTime: currentBooking.startTime.toISOString(),
            endTime: currentBooking.endTime.toISOString(),
          },
          Number(data.expectedAttendees ?? event.expectedAttendees) || undefined,
          id,
          startVal ? new Date(startVal as string | Date) : null,
          endVal ? new Date(endVal as string | Date) : null
        );
      }
    }
    const user = await tx.user.findUnique({ where: { id: userId } });
    await tx.workflowHistory.create({ data: { eventId: id, fromStatus: event.status, toStatus: event.status, action: 'UPDATE', actorId: userId, actorName: user?.fullName, actorRole: user?.role, comments: String(data.changeNote || 'Cập nhật hồ sơ') } });

    await tx.eventVersion.updateMany({
      where: { eventId: id, isActive: true },
      data: { isActive: false, budgetData: JSON.stringify(event) },
    });
    const snapshot = await tx.event.findUniqueOrThrow({
      where: { id },
      include: {
        budgetItems: true,
        scheduleItems: true,
        resourceBookings: { include: { bookingItems: true } },
        attachments: { select: { id: true, originalName: true, category: true, filePath: true } },
      },
    });
    const changeNote = String(data.changeNote || 'Cập nhật hồ sơ');
    await tx.eventVersion.create({
      data: {
        eventId: id,
        version: snapshot.currentVersion,
        title: snapshot.title,
        description: snapshot.description,
        objectives: snapshot.objectives,
        planContent: snapshot.planContent,
        budgetData: JSON.stringify(snapshot),
        changeNote,
        changedBy: userId,
        isActive: true,
      },
    });
    if (userRole === UserRole.ADMIN) {
      await tx.auditLog.create({
        data: {
          userId,
          action: 'ADMIN_UPDATE_EVENT',
          entityType: 'Event',
          entityId: id,
          oldValue: JSON.stringify({ status: event.status, version: event.currentVersion }),
          newValue: JSON.stringify({
            status: event.status,
            version: snapshot.currentVersion,
            reason: changeNote,
            workflowOverride: !isEditableEventStatus(event.status),
          }),
        },
      });
    }
  });
  return getEventById(id);
}

export async function submitEvent(id: string, userId: string, userRole: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      budgetItems: true,
      scheduleItems: true,
      resourceBookings: { include: { facility: true } },
    },
  });

  if (!event || event.deletedAt) throw new Error('Không tìm thấy hồ sơ');
  if (userRole !== UserRole.ADMIN && (userRole !== UserRole.BTC || event.createdById !== userId)) {
    throw new EventEditAuthorizationError('Không có quyền nộp hồ sơ này');
  }
  if (event.status === EventStatus.FACULTY_REVIEW) {
    const previousSubmission = await prisma.workflowHistory.findFirst({
      where: {
        eventId: id,
        action: 'SUBMIT',
        actorId: userId,
        toStatus: EventStatus.FACULTY_REVIEW,
      },
    });
    if (previousSubmission) return getEventById(id);
  }

  // BTC or ADMIN can submit

  const submittableStatuses = [
    EventStatus.DRAFT,
    EventStatus.FACULTY_REVISION_REQUESTED,
    EventStatus.UNIVERSITY_REVISION_REQUESTED,
    EventStatus.BUDGET_REVISION_REQUESTED,
  ];

  if (!submittableStatuses.includes(event.status as EventStatus)) {
    throw new Error('Không thể nộp hồ sơ ở trạng thái hiện tại');
  }

  const issues = validateEventSubmission(event);
  if (issues.length) throw new EventSubmissionValidationError(issues);

  const targetStatus = event.status === EventStatus.UNIVERSITY_REVISION_REQUESTED
    ? EventStatus.UNIVERSITY_REVIEW
    : event.status === EventStatus.BUDGET_REVISION_REQUESTED
      ? EventStatus.BUDGET_REVIEW
      : EventStatus.FACULTY_REVIEW;
  const action = event.status === EventStatus.DRAFT ? 'SUBMIT' : 'RESUBMIT';
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const result = await prisma.$transaction(async (tx) => {
    const changed = await tx.event.updateMany({ where: { id, status: event.status, currentVersion: event.currentVersion }, data: { status: targetStatus, currentVersion: { increment: 1 } } });
    if (!changed.count) throw new Error('Hồ sơ đã thay đổi trên máy khác');
    const updated = await tx.event.findUniqueOrThrow({ where: { id } });

    await tx.workflowHistory.create({
      data: {
        eventId: id,
        fromStatus: event.status,
        toStatus: targetStatus,
        action,
        actorId: userId,
        actorName: user?.fullName,
        actorRole: user?.role,
        comments: action === 'SUBMIT' ? 'Nộp hồ sơ xét duyệt' : 'Gửi lại hồ sơ sau khi chỉnh sửa',
      },
    });

    const targetRole = targetStatus === EventStatus.FACULTY_REVIEW
      ? UserRole.BCN_KHOA
      : UserRole.DOAN_TRUONG;
    const reviewerUsers = await tx.user.findMany({
      where: { role: targetRole, isActive: true },
    });
    for (const u of reviewerUsers) {
      await tx.notification.create({
        data: {
          userId: u.id,
          eventId: id,
          title: action === 'SUBMIT' ? 'Hồ sơ mới cần xét duyệt' : 'Hồ sơ đã được gửi lại',
          content: `Hồ sơ "${event.title}" (${event.eventCode}) đã được gửi đến cấp xét duyệt.`,
          type: 'ACTION_REQUIRED',
          category: 'APPROVAL',
          linkUrl: `/events/${id}`,
        },
      });
    }

    // Notify BTC
    await tx.notification.create({
      data: {
        userId: userId,
        eventId: id,
        title: 'Hồ sơ đã được nộp',
        content: `Hồ sơ "${event.title}" (${event.eventCode}) đã được nộp thành công.`,
        type: 'SUCCESS',
        category: 'APPROVAL',
        linkUrl: `/events/${id}`,
      },
    });

    return updated;
  });

  return result;
}

export async function getEventHistory(id: string) {
  const [history, decisions] = await Promise.all([
    prisma.workflowHistory.findMany({
      where: { eventId: id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.approvalDecision.findMany({
      where: { eventId: id },
      include: { decidedBy: { select: { fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);
  if (history.length || !decisions.length) return history;
  return decisions.map((decision) => ({
    id: decision.id,
    eventId: id,
    fromStatus: '',
    toStatus: decision.stage,
    action: decision.decision,
    actorId: decision.decidedById,
    actorName: decision.decidedBy.fullName,
    actorRole: decision.decidedBy.role,
    comments: decision.comments || decision.reason,
    metadata: null,
    createdAt: decision.createdAt,
  }));
}
