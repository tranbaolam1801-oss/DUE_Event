/**
 * EventFlow API Client
 * Connects frontend to the Express + Prisma REST API
 */
import type { FinancialDocument } from '../types';

const BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const API_FIELD_LABELS: Record<string, string> = {
  title: 'Tên sự kiện',
  objectives: 'Mục tiêu sự kiện',
  organizingUnit: 'Đơn vị tổ chức',
  targetAudience: 'Đối tượng tham dự',
  contactEmail: 'Email liên hệ',
  contactPhone: 'Số điện thoại liên hệ',
  expectedAttendees: 'Số người tham dự',
  startDate: 'Thời gian bắt đầu',
  endDate: 'Thời gian kết thúc',
  scheduleItems: 'Kịch bản chương trình',
  budgetItems: 'Dự trù kinh phí',
  'booking.facilityId': 'Địa điểm tổ chức',
  booking: 'Địa điểm tổ chức',
  'booking.equipmentItems': 'Thiết bị đăng ký',
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function getAuthToken(): string | null {
  return localStorage.getItem('eventflow_token') || sessionStorage.getItem('eventflow_token');
}

export function setAuthToken(token: string, remember = true): void {
  if (remember) {
    localStorage.setItem('eventflow_token', token);
    sessionStorage.removeItem('eventflow_token');
  } else {
    sessionStorage.setItem('eventflow_token', token);
    localStorage.removeItem('eventflow_token');
  }
}

export function removeAuthToken(): void {
  localStorage.removeItem('eventflow_token');
  sessionStorage.removeItem('eventflow_token');
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || AbortSignal.timeout(15000),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi mạng không xác định';
    throw new ApiRequestError(`Không kết nối được API ${endpoint}: ${message}`, 0);
  }

  const contentType = response.headers.get('content-type') || '';
  let data: any;
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      throw new ApiRequestError(`API ${endpoint} trả về JSON không hợp lệ`, response.status);
    }
  } else {
    const responseText = await response.text();
    const message = responseText.trim() || `API ${endpoint} không trả về JSON`;
    throw new ApiRequestError(message, response.status);
  }

  if (!response.ok) {
    const issues = Array.isArray(data.data) ? data.data : [];
    const fieldErrors: Record<string, string> = {};
    for (const issue of issues) {
      if (typeof issue.field !== 'string') continue;
      const field = issue.field;
      const label = API_FIELD_LABELS[field] || API_FIELD_LABELS[field.replace(/\.\d+\./g, '.')] || field;
      const message = typeof issue.message === 'string' && !/^Invalid (input|datetime|enum)/.test(issue.message)
        ? issue.message
        : `Vui lòng kiểm tra ${label.toLowerCase()}`;
      fieldErrors[field] = message;
    }
    const issueMessages = Object.values(fieldErrors);
    throw new ApiRequestError(
      issueMessages.length ? issueMessages.join('; ') : data.error || data.message || 'Yêu cầu API thất bại',
      response.status,
      fieldErrors
    );
  }

  return data;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ success: boolean; data: { token: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { fullName: string; email: string; password: string; confirmPassword: string; phone?: string; department?: string }) =>
    request<{ success: boolean; message: string; data: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  verifyOtp: (email: string, otp: string) =>
    request<{ success: boolean; resetSessionToken: string; email: string; message: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),
  verifyResetToken: (token: string) =>
    request<{ success: boolean; email: string }>('/auth/verify-reset-token?token=' + encodeURIComponent(token)),
  resetPassword: (data: { token: string; newPassword: string; confirmPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  googleAuth: (credential: string) =>
    request<{ success: boolean; data?: any; error?: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    }),
  sendOtp: (phone: string) =>
    request<{ success: boolean; message?: string; error?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),
  getMe: () => request<{ success: boolean; data: any }>('/auth/me'),

  // Events
  getEvents: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; events: any[]; pagination: { totalPages: number } }>(`/events${qs}`);
  },
  getEventById: (id: string) => request<{ success: boolean; data: any }>(`/events/${id}`),
  createEvent: (data: any, idempotencyKey?: string) =>
    request<{ success: boolean; data: any }>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
    }),
  deleteEvent: (id: string, reason: string) =>
    request<{ success: boolean; data: { id: string; deletedAt: string; deletedById: string; deleteReason: string } }>(`/events/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),
  restoreEvent: (id: string, reason: string) =>
    request<{ success: boolean; data: { id: string; restored: boolean } }>(`/events/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  updateEvent: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  submitEvent: (id: string) =>
    request<{ success: boolean; data: any; message: string }>(`/events/${id}/submit`, {
      method: 'POST',
    }),
  reviewEvent: (id: string, action: string, comments?: string, reason?: string) =>
    request<{ success: boolean; data: any; message: string }>(`/events/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, comments, reason }),
    }),
  getAvailableActions: (id: string) =>
    request<{ success: boolean; data: string[] }>(`/events/${id}/available-actions`),
  getEventHistory: (id: string) =>
    request<{ success: boolean; data: any[] }>(`/events/${id}/history`),

  // Bookings & Resources
  checkConflict: (facilityId: string, startTime: string, endTime: string, excludeBookingId?: string) =>
    request<{ success: boolean; conflict: boolean; conflictingBookings: any[] }>('/bookings/check-conflict', {
      method: 'POST',
      body: JSON.stringify({ facilityId, startTime, endTime, excludeBookingId }),
    }),
  createBooking: (data: any) =>
    request<{ success: boolean; data: any }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmBooking: (id: string) =>
    request<{ success: boolean; data: any; message: string }>(`/bookings/${id}/confirm`, {
      method: 'PUT',
    }),
  rejectBooking: (id: string) =>
    request<{ success: boolean; data: any; message: string }>(`/bookings/${id}/reject`, {
      method: 'PUT',
    }),
  getFacilityCalendar: (facilityId: string, startDate?: string, endDate?: string) => {
    const qs = new URLSearchParams({ ...(startDate && { startDate }), ...(endDate && { endDate }) }).toString();
    return request<{ success: boolean; data: any[] }>(`/bookings/facilities/${facilityId}/calendar?${qs}`);
  },

  // AI Assistant
  aiReview: (eventId: string) =>
    request<{ success: boolean; data: any }>('/ai/review', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    }),
  analyzeEvent: (eventId: string) =>
    request<{ success: boolean; data: any }>('/ai/analyze-event', {
      method: 'POST',
      body: JSON.stringify({ eventId }),
    }),
  suggestResources: (expectedAttendees: number, startTime: string, endTime: string, eventType?: string) =>
    request<{ success: boolean; data: any }>('/ai/resource-suggestions', {
      method: 'POST',
      body: JSON.stringify({ expectedAttendees, startTime, endTime, eventType }),
    }),
  draftReport: (eventId: string, actualAttendees?: number, highlights?: string[]) =>
    request<{ success: boolean; data: any }>('/ai/generate-report', {
      method: 'POST',
      body: JSON.stringify({ eventId, actualAttendees, highlights }),
    }),

  // Handover & Return
  createHandover: (data: any) =>
    request<{ success: boolean; data: any; message: string }>('/handover', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createInspection: (data: any) =>
    request<{ success: boolean; data: any; message: string }>('/handover/inspection', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createIncident: (data: any) =>
    request<{ success: boolean; data: any; message: string }>('/handover/incident', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getHandoverRecords: (eventId: string) =>
    request<{ success: boolean; data: { handovers: any[]; inspections: any[]; incidents: any[] } }>(`/handover/${eventId}`),

  // Settlement & Finance
  getSettlement: (eventId: string) =>
    request<{ success: boolean; data: any }>(`/settlements/${eventId}`),
  createSettlement: (data: any) =>
    request<{ success: boolean; data: any }>('/settlements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSettlement: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/settlements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  submitSettlement: (id: string) =>
    request<{ success: boolean; data: any; message: string }>(`/settlements/${id}/submit`, {
      method: 'POST',
    }),
  reviewSettlement: (id: string, decision: 'APPROVED' | 'REVISION_REQUESTED' | 'REJECTED', notes?: string) =>
    request<{ success: boolean; data: any; message: string }>(`/settlements/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes }),
    }),
  verifyFinancialDocument: (documentId: string, isVerified: boolean) =>
    request<{ success: boolean; data: FinancialDocument }>(`/settlements/documents/${documentId}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ isVerified }),
    }),
  uploadFinancialDocument: async (
    settlementId: string,
    document: { documentType: string; documentNumber?: string; amount?: number; description?: string },
    file: File
  ) => {
    const formData = new FormData();
    formData.append('file', file);
    for (const [key, value] of Object.entries(document)) {
      if (value !== undefined) formData.append(key, String(value));
    }
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/settlements/${settlementId}/documents/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Tải chứng từ thất bại');
    return data;
  },
  downloadFinancialDocument: async (settlementId: string, documentId: string, name: string) => {
    const response = await fetch(`${BASE_URL}/settlements/${settlementId}/documents/${documentId}/download`, {
      headers: { Authorization: `Bearer ${getAuthToken() || ''}` },
    });
    if (!response.ok) throw new Error('Không tải được chứng từ quyết toán');
    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = await response.json();
      window.location.assign(result.url);
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // Analytics
  getDashboardStats: () =>
    request<{ success: boolean; data: any }>('/analytics/dashboard'),
  getWorkflowBottlenecks: () =>
    request<{ success: boolean; data: any }>('/analytics/workflow-bottlenecks'),
  getProcessingTimes: () =>
    request<{ success: boolean; data: { averageDays: number; events: Array<{ eventCode: string; title: string; days: number }> } }>('/analytics/processing-times'),
  // Attachments
  uploadAttachment: async (eventId: string, file: File, category: 'TIMELINE' | 'BUDGET' | 'OTHER') => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${BASE_URL}/events/${eventId}/attachments`, {
      method: 'POST',
      headers,
      body: formData,
    });
    let data: any;
    try {
      data = await response.json();
    } catch {
      throw new Error('Máy chủ trả về phản hồi tải tệp không hợp lệ');
    }
    if (!response.ok) {
      throw new Error(data.error || 'Tải lên tài liệu thất bại');
    }
    if (!data.success || !data.data?.id) {
      throw new Error('Máy chủ chưa xác nhận lưu metadata của tệp');
    }
    return data;
  },
  deleteAttachment: (eventId: string, attachmentId: string) =>
    request<{ success: boolean }>(`/events/${eventId}/attachments/${attachmentId}`, { method: 'DELETE' }),
  getAttachmentViewUrl: async (eventId: string, attachmentId: string) => {
    const token = getAuthToken();
    const response = await fetch(
      `${BASE_URL}/events/${eventId}/attachments/${attachmentId}/download?inline=true`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: AbortSignal.timeout(15000) }
    );
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || 'Không mở được tệp đính kèm');
    }
    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = await response.json();
      if (typeof result.url !== 'string') throw new Error('Máy chủ không trả liên kết xem tệp hợp lệ');
      return result.url;
    }
    return URL.createObjectURL(await response.blob());
  },
  downloadAttachment: async (eventId: string, attachmentId: string, name: string) => {
    const response = await fetch(`${BASE_URL}/events/${eventId}/attachments/${attachmentId}/download`, {
      headers: { Authorization: `Bearer ${getAuthToken() || ''}` },
    });
    if (!response.ok) throw new Error('Không tải được tệp đính kèm');
    if (response.headers.get('content-type')?.includes('application/json')) {
      const result = await response.json();
      window.location.assign(result.url);
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a'); link.href = url; link.download = name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  getAttachmentDownloadUrl: (eventId: string, attachmentId: string) =>
    `${BASE_URL}/events/${eventId}/attachments/${attachmentId}/download`,

  // Users
  getUsers: () => request<{ success: boolean; data: any[] }>('/users'),
  createUser: (userData: any) => request<{ success: boolean; data: any }>('/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id: string, userData: any) => request<{ success: boolean; data: any }>('/users/' + id, { method: 'PUT', body: JSON.stringify(userData) }),
  lockUser: (id: string, reason?: string) =>
    request<{ success: boolean; message: string; data: any }>(`/users/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  unlockUser: (id: string) =>
    request<{ success: boolean; message: string; data: any }>(`/users/${id}/unlock`, {
      method: 'POST',
    }),

  // Facilities & Equipment Management (Full CRUD)
  getFacilities: (all?: boolean) =>
    request<{ success: boolean; data: any[] }>(`/bookings/facilities${all ? '?all=true' : ''}`),
  createFacility: (data: any) =>
    request<{ success: boolean; data: any }>('/bookings/facilities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateFacility: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/bookings/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteFacility: (id: string) =>
    request<{ success: boolean; message: string }>(`/bookings/facilities/${id}`, {
      method: 'DELETE',
    }),
  toggleFacility: (id: string) =>
    request<{ success: boolean; data: any }>(`/bookings/facilities/${id}/toggle`, {
      method: 'PATCH',
    }),

  getEquipment: (all?: boolean) =>
    request<{ success: boolean; data: any[] }>(`/bookings/equipment${all ? '?all=true' : ''}`),
  createEquipment: (data: any) =>
    request<{ success: boolean; data: any }>('/bookings/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEquipment: (id: string, data: any) =>
    request<{ success: boolean; data: any }>(`/bookings/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEquipment: (id: string) =>
    request<{ success: boolean; message: string }>(`/bookings/equipment/${id}`, {
      method: 'DELETE',
    }),
  toggleEquipment: (id: string) =>
    request<{ success: boolean; data: any }>(`/bookings/equipment/${id}/toggle`, {
      method: 'PATCH',
    }),
};
