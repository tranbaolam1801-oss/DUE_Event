import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { serializableTransaction } from '../utils/transaction';

export async function checkAvailability(facilityId: string, startTime: Date, endTime: Date, excludeBookingId?: string, db: Prisma.TransactionClient = prisma) {
  const where: Record<string, unknown> = {
    facilityId,
    status: { in: ['PENDING', 'TENTATIVE', 'CONFIRMED', 'CONFLICT'] },
    // Overlap check: NOT(end1 <= start2 OR start1 >= end2) => start1 < end2 AND end1 > start2
    startTime: { lt: endTime },
    endTime: { gt: startTime },
  };

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  const conflicts = await db.resourceBooking.findMany({
    where,
    include: {
      facility: true,
      event: { select: { id: true, eventCode: true, title: true } },
    },
  });

  return conflicts;
}

export async function checkEquipmentAvailability(
  equipmentId: string,
  quantity: number,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: string,
  db: Prisma.TransactionClient = prisma
) {
  const equipment = await db.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) throw new Error('Không tìm thấy thiết bị');

  const where: Record<string, unknown> = {
    equipmentId,
    booking: {
      status: { in: ['PENDING', 'TENTATIVE', 'CONFIRMED', 'CONFLICT'] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  };

  if (excludeBookingId) {
    where.booking = {
      ...(where.booking as Record<string, unknown>),
      id: { not: excludeBookingId },
    };
  }

  const bookedItems = await db.resourceBookingItem.findMany({ where });
  const totalBooked = bookedItems.reduce((sum, item) => sum + item.quantity, 0);
  const available = equipment.totalQuantity - totalBooked;

  return {
    equipment,
    totalQuantity: equipment.totalQuantity,
    booked: totalBooked,
    available,
    isAvailable: available >= quantity,
  };
}

export async function createBooking(data: {
  eventId: string;
  facilityId: string;
  startTime: string;
  endTime: string;
  setupTime?: string;
  teardownTime?: string;
  expectedAttendees?: number;
  purpose?: string;
  specialRequests?: string;
  alternativeOption?: string;
  equipmentItems?: Array<{ equipmentId: string; quantity: number }>;
}) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) {
    throw new Error('Khoảng thời gian đặt phòng không hợp lệ');
  }
  const equipmentIds = new Set<string>();
  for (const item of data.equipmentItems || []) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || equipmentIds.has(item.equipmentId)) {
      throw new Error('Số lượng thiết bị không hợp lệ hoặc thiết bị bị lặp');
    }
    equipmentIds.add(item.equipmentId);
  }
  const booking = await serializableTransaction(async (tx) => {
  // Check facility availability
  const conflicts = await checkAvailability(data.facilityId, start, end, undefined, tx);
  if (conflicts.length > 0) {
    const conflictInfo = conflicts.map(c =>
      `${c.event.eventCode} (${c.startTime.toLocaleString()} - ${c.endTime.toLocaleString()})`
    ).join(', ');
    throw new Error(`Phòng đã được đặt trong khoảng thời gian này. Xung đột với: ${conflictInfo}`);
  }

  // Check facility capacity
  const facility = await tx.facility.findUnique({ where: { id: data.facilityId } });
  if (facility && data.expectedAttendees && facility.capacity && data.expectedAttendees > facility.capacity) {
    throw new Error(`Số người tham dự (${data.expectedAttendees}) vượt quá sức chứa phòng (${facility.capacity})`);
  }

  // Check equipment availability
  if (data.equipmentItems?.length) {
    for (const item of data.equipmentItems) {
      const check = await checkEquipmentAvailability(item.equipmentId, item.quantity, start, end, undefined, tx);
      if (!check.isAvailable) {
        throw new Error(`Thiết bị "${check.equipment.name}" không đủ số lượng (cần ${item.quantity}, khả dụng ${check.available})`);
      }
    }
  }

    const created = await tx.resourceBooking.create({
      data: {
        eventId: data.eventId,
        facilityId: data.facilityId,
        startTime: start,
        endTime: end,
        setupTime: data.setupTime ? new Date(data.setupTime) : undefined,
        teardownTime: data.teardownTime ? new Date(data.teardownTime) : undefined,
        expectedAttendees: data.expectedAttendees,
        purpose: data.purpose,
        specialRequests: data.specialRequests,
        alternativeOption: data.alternativeOption,
        status: 'PENDING',
      },
    });

    if (data.equipmentItems?.length) {
      await tx.resourceBookingItem.createMany({
        data: data.equipmentItems.map((item) => ({
          bookingId: created.id,
          equipmentId: item.equipmentId,
          quantity: item.quantity,
        })),
      });
    }

    return created;
  });

  return booking;
}

export async function confirmBooking(bookingId: string, userId: string) {
  return serializableTransaction(async (tx) => {
  const booking = await tx.resourceBooking.findUnique({
    where: { id: bookingId },
    include: { event: { select: { status: true } } },
  });
  if (!booking) throw new Error('Không tìm thấy đặt chỗ');
  if (booking.event.status !== 'FACILITY_REVIEW') {
    throw new Error('Chỉ xác nhận giữ chỗ khi hồ sơ đang ở bước xét duyệt cơ sở vật chất');
  }
  if (booking.status !== 'PENDING' && booking.status !== 'TENTATIVE') {
    throw new Error('Không thể xác nhận đặt chỗ ở trạng thái hiện tại');
  }

  // Re-check availability at confirmation time (prevent race condition)
  const conflicts = await checkAvailability(booking.facilityId, booking.startTime, booking.endTime, bookingId, tx);
  if (conflicts.length > 0) {
    throw new Error('Phòng đã được đặt bởi sự kiện khác trong khoảng thời gian này');
  }

  return tx.resourceBooking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED', confirmedById: userId, confirmedAt: new Date() },
  });
  });
}

export async function rejectBooking(bookingId: string, userId: string) {
  return prisma.resourceBooking.update({
    where: { id: bookingId },
    data: { status: 'REJECTED' },
  });
}

export async function getBookingsForFacility(facilityId: string, startDate: Date, endDate: Date) {
  return prisma.resourceBooking.findMany({
    where: {
      facilityId,
      status: { in: ['PENDING', 'TENTATIVE', 'CONFIRMED', 'CONFLICT'] },
      startTime: { lt: endDate },
      endTime: { gt: startDate },
    },
    include: {
      event: { select: { id: true, eventCode: true, title: true, organizingUnit: true } },
      facility: true,
      bookingItems: { include: { equipment: true } },
    },
    orderBy: { startTime: 'asc' },
  });
}

export async function getAllBookings(filters?: { status?: string; eventId?: string }) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.eventId) where.eventId = filters.eventId;

  return prisma.resourceBooking.findMany({
    where,
    include: {
      event: { select: { id: true, eventCode: true, title: true } },
      facility: true,
      bookingItems: { include: { equipment: true } },
    },
    orderBy: { startTime: 'desc' },
  });
}
