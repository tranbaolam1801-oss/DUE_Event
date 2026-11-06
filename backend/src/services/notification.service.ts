import prisma from '../config/database';
import { UserRole, EventStatus } from '../types';

export async function createNotification(data: {
  userId: string;
  eventId?: string;
  title: string;
  content: string;
  type: string;
  category?: string;
  linkUrl?: string;
}) {
  return prisma.notification.create({ data });
}

export async function getNotifications(userId: string, filters?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}) {
  const { page = 1, limit = 20, isRead } = filters || {};
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { userId };
  if (isRead !== undefined) where.isRead = isRead;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        event: { select: { id: true, eventCode: true, title: true } },
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, isRead: false } });
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Bản nháp',
  FACULTY_REVIEW: 'BCN Khoa đang xét duyệt',
  FACULTY_REVISION_REQUESTED: 'BCN Khoa yêu cầu chỉnh sửa',
  FACULTY_REJECTED: 'BCN Khoa từ chối',
  UNIVERSITY_REVIEW: 'Đoàn Trường đang thẩm định',
  UNIVERSITY_REVISION_REQUESTED: 'Đoàn Trường yêu cầu chỉnh sửa',
  UNIVERSITY_REJECTED: 'Đoàn Trường từ chối',
  UNIVERSITY_APPROVED: 'Đoàn Trường chấp thuận',
  PERMIT_ISSUED: 'Đã cấp phép',
  BUDGET_REVIEW: 'Đang xét duyệt ngân sách',
  BUDGET_REVISION_REQUESTED: 'Yêu cầu điều chỉnh ngân sách',
  BUDGET_REJECTED: 'Ngân sách không đạt',
  FACILITY_REVIEW: 'Đang xét CSVC',
  FACILITY_CONFLICT: 'Xung đột lịch CSVC',
  FACILITY_REVISION_REQUESTED: 'Yêu cầu đổi CSVC',
  FACILITY_RESERVED: 'CSVC đã đặt chỗ',
  READY_FOR_EVENT: 'Sẵn sàng tổ chức',
  FACILITY_HANDED_OVER: 'Đã bàn giao CSVC',
  EVENT_IN_PROGRESS: 'Đang diễn ra',
  FACILITY_RETURN_PENDING: 'Chờ hoàn trả CSVC',
  FACILITY_INSPECTION: 'Đang kiểm tra CSVC',
  FACILITY_INCIDENT: 'Có sự cố CSVC',
  FACILITY_ACCEPTED: 'Đã nghiệm thu CSVC',
  REPORT_PENDING: 'Chờ báo cáo tổng kết',
  FINANCE_DOCUMENTS_PENDING: 'Chờ chứng từ tài chính',
  FINANCE_REVIEW: 'KHTC đang kiểm tra',
  FINANCE_REVISION_REQUESTED: 'KHTC yêu cầu bổ sung',
  FINANCE_APPROVAL_PENDING: 'Chờ phê duyệt thanh toán',
  PAYMENT_REJECTED: 'Từ chối thanh toán',
  SETTLED: 'Đã quyết toán',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

export async function notifyEventStatusChange(
  event: { id: string; title: string; eventCode: string; createdById: string },
  fromStatus: string,
  toStatus: string,
  actorName: string,
  comments?: string
) {
  const label = statusLabels[toStatus] || toStatus;
  const title = `Cập nhật hồ sơ: ${event.eventCode}`;
  const content = `Hồ sơ "${event.title}" đã chuyển sang trạng thái: ${label}. ${comments ? `Ghi chú: ${comments}` : ''}`;

  // Always notify the event creator
  await createNotification({
    userId: event.createdById,
    eventId: event.id,
    title,
    content,
    type: toStatus.includes('REJECTED') ? 'ERROR' : toStatus.includes('REVISION') ? 'WARNING' : 'INFO',
    category: 'APPROVAL',
    linkUrl: `/events/${event.id}`,
  });

  // Notify specific role based on new status
  let targetRole: UserRole | null = null;
  if (toStatus === EventStatus.FACULTY_REVIEW) targetRole = UserRole.BCN_KHOA;
  else if (toStatus === EventStatus.UNIVERSITY_REVIEW || toStatus === EventStatus.BUDGET_REVIEW) targetRole = UserRole.DOAN_TRUONG;
  else if (toStatus === EventStatus.FACILITY_REVIEW) targetRole = UserRole.CSVC;
  else if (toStatus === EventStatus.FINANCE_REVIEW || toStatus === EventStatus.FINANCE_APPROVAL_PENDING) targetRole = UserRole.KHTC;

  if (targetRole) {
    const users = await prisma.user.findMany({
      where: { role: targetRole, isActive: true },
    });
    for (const u of users) {
      if (u.id !== event.createdById) {
        await createNotification({
          userId: u.id,
          eventId: event.id,
          title: `Hồ sơ cần xử lý: ${event.eventCode}`,
          content: `Hồ sơ "${event.title}" cần được xử lý. Trạng thái: ${label}`,
          type: 'ACTION_REQUIRED',
          category: 'APPROVAL',
          linkUrl: `/events/${event.id}`,
        });
      }
    }
  }
}
