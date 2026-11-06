import { EventStatus, UserRole } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export const roleNames: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  BTC: 'Ban Tổ chức (Sinh viên)',
  BCN_KHOA: 'Ban Chủ nhiệm Khoa',
  DOAN_TRUONG: 'Đoàn Trường ĐHKT',
  CSVC: 'Bộ phận Cơ sở vật chất',
  KHTC: 'Phòng Kế hoạch - Tài chính',
};

export const statusLabels: Record<EventStatus, { label: string; color: string; bg: string; border: string }> = {
  DRAFT: { label: 'Bản nháp', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  SUBMITTED: { label: 'Đã nộp hồ sơ', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  FACULTY_REVIEW: { label: 'BCN Khoa đang duyệt', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  FACULTY_REVISION_REQUESTED: { label: 'Khoa yêu cầu sửa', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  FACULTY_REJECTED: { label: 'Khoa từ chối', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
  FACULTY_APPROVED: { label: 'Khoa đã duyệt', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  UNIVERSITY_REVIEW: { label: 'Đoàn trường thẩm định', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  UNIVERSITY_REVISION_REQUESTED: { label: 'Đoàn trường yêu cầu sửa', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  UNIVERSITY_REJECTED: { label: 'Đoàn trường từ chối', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
  UNIVERSITY_APPROVED: { label: 'Đoàn trường chấp thuận', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  PERMIT_ISSUED: { label: 'Đã cấp phép', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  BUDGET_REVIEW: { label: 'Đang duyệt ngân sách', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  BUDGET_REVISION_REQUESTED: { label: 'Yêu cầu sửa ngân sách', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  BUDGET_REJECTED: { label: 'Ngân sách không duyệt', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-200' },
  FACILITY_REVIEW: { label: 'CSVC kiểm tra lịch', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  FACILITY_CONFLICT: { label: 'Trùng lịch phòng/CSVC', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-300' },
  FACILITY_REVISION_REQUESTED: { label: 'CSVC yêu cầu đổi phương án', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  FACILITY_RESERVED: { label: 'Đã giữ chỗ CSVC', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  READY_FOR_EVENT: { label: 'Sẵn sàng tổ chức', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  FACILITY_HANDED_OVER: { label: 'Đã bàn giao phòng', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  EVENT_IN_PROGRESS: { label: 'Đang diễn ra sự kiện', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-300' },
  FACILITY_RETURN_PENDING: { label: 'Chờ nghiệm thu hoàn trả', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  FACILITY_INSPECTION: { label: 'Đang kiểm tra hoàn trả', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  FACILITY_INCIDENT: { label: 'Có sự cố / hư hỏng thiết bị', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-300' },
  FACILITY_ACCEPTED: { label: 'Đã hoàn tất nghiệm thu CSVC', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  REPORT_PENDING: { label: 'Chờ nộp báo cáo tổng kết', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  FINANCE_DOCUMENTS_PENDING: { label: 'Chờ nộp chứng từ KHTC', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  FINANCE_REVIEW: { label: 'KHTC đang kiểm tra chứng từ', color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200' },
  FINANCE_REVISION_REQUESTED: { label: 'KHTC yêu cầu bổ sung chứng từ', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  FINANCE_APPROVAL_PENDING: { label: 'Chờ duyệt chi thanh toán', color: 'text-orange-800', bg: 'bg-orange-50', border: 'border-orange-200' },
  PAYMENT_REJECTED: { label: 'Từ chối thanh toán', color: 'text-rose-800', bg: 'bg-rose-50', border: 'border-rose-300' },
  SETTLED: { label: 'Đã quyết toán tài chính', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  COMPLETED: { label: 'Hồ sơ đã hoàn tất', color: 'text-emerald-900', bg: 'bg-emerald-100', border: 'border-emerald-300' },
  CANCELLED: { label: 'Đã hủy', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300' },
};

export const workflowStages = [
  { id: 1, name: 'Khởi tạo hồ sơ', statuses: ['DRAFT', 'SUBMITTED'] },
  { id: 2, name: 'BCN Khoa duyệt', statuses: ['FACULTY_REVIEW', 'FACULTY_REVISION_REQUESTED', 'FACULTY_APPROVED', 'FACULTY_REJECTED'] },
  { id: 3, name: 'Đoàn Trường cấp phép', statuses: ['UNIVERSITY_REVIEW', 'UNIVERSITY_REVISION_REQUESTED', 'UNIVERSITY_APPROVED', 'PERMIT_ISSUED', 'UNIVERSITY_REJECTED'] },
  { id: 4, name: 'Thẩm định ngân sách', statuses: ['BUDGET_REVIEW', 'BUDGET_REVISION_REQUESTED', 'BUDGET_REJECTED'] },
  { id: 5, name: 'Xác nhận CSVC', statuses: ['FACILITY_REVIEW', 'FACILITY_CONFLICT', 'FACILITY_REVISION_REQUESTED', 'FACILITY_RESERVED'] },
  { id: 6, name: 'Tổ chức sự kiện', statuses: ['READY_FOR_EVENT', 'FACILITY_HANDED_OVER', 'EVENT_IN_PROGRESS'] },
  { id: 7, name: 'Nghiệm thu CSVC', statuses: ['FACILITY_RETURN_PENDING', 'FACILITY_INSPECTION', 'FACILITY_INCIDENT', 'FACILITY_ACCEPTED'] },
  { id: 8, name: 'Quyết toán tài chính', statuses: ['REPORT_PENDING', 'FINANCE_DOCUMENTS_PENDING', 'FINANCE_REVIEW', 'FINANCE_REVISION_REQUESTED', 'FINANCE_APPROVAL_PENDING', 'PAYMENT_REJECTED', 'SETTLED'] },
  { id: 9, name: 'Hoàn tất và Lưu trữ', statuses: ['COMPLETED', 'CANCELLED'] },
];

export function getCurrentStageIndex(status: EventStatus): number {
  for (let i = 0; i < workflowStages.length; i++) {
    if (workflowStages[i].statuses.includes(status)) {
      return i;
    }
  }
  return 0;
}
