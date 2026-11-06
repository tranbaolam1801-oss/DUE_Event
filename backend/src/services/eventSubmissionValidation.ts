export interface EventSubmissionIssue {
  field: string;
  message: string;
}

interface EventSubmissionData {
  title: string | null;
  organizingUnit: string | null;
  objectives: string | null;
  targetAudience: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  expectedAttendees: number | null;
  startDate: Date | null;
  endDate: Date | null;
  scheduleItems: Array<{ timeSlot: string; activity: string }>;
  budgetItems: Array<{ itemName: string; quantity: number; unitPrice: number }>;
  resourceBookings: Array<{ facilityId: string; facility: { isActive: boolean } | null }>;
  attachments?: Array<{ category: string | null }> | null;
}

export function validateEventSubmission(
  event: EventSubmissionData,
  now: Date = new Date()
): EventSubmissionIssue[] {
  const issues: EventSubmissionIssue[] = [];
  const addIssue = (field: string, message: string) => {
    if (!issues.some((issue) => issue.field === field)) issues.push({ field, message });
  };

  if (!event.title?.trim()) {
    addIssue('title', 'Vui lòng nhập tên sự kiện');
  } else if (event.title.trim().length < 5) {
    addIssue('title', 'Tên sự kiện cần có ít nhất 5 ký tự');
  }

  if (!event.organizingUnit?.trim()) {
    addIssue('organizingUnit', 'Vui lòng nhập đơn vị tổ chức');
  }

  if (!event.objectives?.trim()) {
    addIssue('objectives', 'Vui lòng nhập mục tiêu sự kiện');
  } else if (event.objectives.trim().length < 10) {
    addIssue('objectives', 'Mục tiêu cần có ít nhất 10 ký tự');
  }

  if (!event.targetAudience?.trim()) {
    addIssue('targetAudience', 'Vui lòng xác định đối tượng tham dự');
  }
  if (!event.contactEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(event.contactEmail.trim())) {
    addIssue('contactEmail', 'Vui lòng nhập email liên hệ hợp lệ');
  }
  if (!event.contactPhone?.trim() || !/^[0-9+\s-]{9,15}$/.test(event.contactPhone.trim())) {
    addIssue('contactPhone', 'Vui lòng nhập số điện thoại liên hệ hợp lệ');
  }

  if (!event.expectedAttendees || event.expectedAttendees <= 0) {
    addIssue('expectedAttendees', 'Vui lòng nhập số người tham dự lớn hơn 0');
  }

  if (!event.startDate || event.startDate < now) {
    addIssue('startDate', 'Vui lòng chọn thời gian bắt đầu trong tương lai');
  }

  if (!event.endDate || event.endDate < now) {
    addIssue('endDate', 'Vui lòng chọn thời gian kết thúc trong tương lai');
  } else if (event.startDate && event.endDate <= event.startDate) {
    addIssue('endDate', 'Thời gian kết thúc phải sau thời gian bắt đầu');
  }

  const hasTimelineAttachment = Boolean(event.attachments?.some((item) => item.category === 'TIMELINE'));
  if (event.scheduleItems.length === 0 && !hasTimelineAttachment) {
    addIssue('scheduleItems', 'Vui lòng thêm ít nhất một nội dung kịch bản hoặc tải lên tệp timeline kế hoạch');
  } else if (event.scheduleItems.length > 0 && event.scheduleItems.some((item) => !item.timeSlot.trim() || !item.activity.trim())) {
    addIssue('scheduleItems', 'Vui lòng điền khung giờ và nội dung cho từng tiết mục');
  }

  if (event.budgetItems.some((item) =>
    !item.itemName.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0 ||
    !Number.isFinite(item.unitPrice) || item.unitPrice < 0
  )) {
    addIssue('budgetItems', 'Vui lòng kiểm tra tên, số lượng và đơn giá của các khoản chi');
  }

  if (!event.resourceBookings.some((booking) => booking.facilityId.trim() && booking.facility?.isActive)) {
    addIssue('booking.facilityId', 'Vui lòng chọn địa điểm tổ chức');
  }

  return issues;
}

export class EventSubmissionValidationError extends Error {
  constructor(readonly issues: EventSubmissionIssue[]) {
    super('Thông tin hồ sơ chưa hợp lệ');
    this.name = 'EventSubmissionValidationError';
  }
}
