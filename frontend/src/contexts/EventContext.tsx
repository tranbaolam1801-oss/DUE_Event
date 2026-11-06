import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { EventItem, Facility, Equipment, NotificationItem, EventStatus, HandoverRecord, Settlement, EventReport } from '../types';
import { useAuth } from './AuthContext';
import { api, request } from '../services/api';
import { mapEvent, workflowAction } from '../services/eventMapper';

type Result = Promise<boolean>;
type OperationErrorHandler = (error: unknown) => void;
type EventMutationData = Partial<EventItem> & { booking?: EventItem['booking'] | null };
interface EventContextType {
  events: EventItem[]; facilities: Facility[]; equipment: Equipment[]; notifications: NotificationItem[];
  loading: boolean; syncError: string; saving: boolean;
  refresh: () => Promise<void>;
  getEventById: (id: string) => EventItem | undefined;
  createEvent: (data: EventMutationData, idempotencyKey?: string, onError?: OperationErrorHandler) => Promise<EventItem | undefined>;
  updateEvent: (id: string, data: EventMutationData, note?: string, expectedVersion?: number, onError?: OperationErrorHandler) => Result;
  deleteEvent: (id: string, reason: string) => Result;
  restoreEvent: (id: string, reason: string) => Result;
  transitionEvent: (id: string, action: string, target: EventStatus, comments?: string, reason?: string, onError?: OperationErrorHandler) => Result;
  checkFacilityAvailability: (facilityId: string, start: string, end: string, exclude?: string) => { isAvailable: boolean; conflictEvent?: EventItem };
  bookResource: (id: string, booking: EventItem['booking']) => Result;
  confirmBooking: (id: string) => Result;
  rejectBooking: (id: string, reason: string) => Result;
  addHandoverRecord: (id: string, record: Omit<HandoverRecord, 'id' | 'confirmedAt'>) => Result;
  saveSettlement: (id: string, data: Partial<Settlement>) => Result;
  saveReport: (id: string, data: Partial<EventReport>) => Result;
  markNotificationAsRead: (id: string) => Result;
  markAllNotificationsAsRead: () => Result;
  resetAllData: () => void;
  toastMessage: string | null; toastType: 'success' | 'error' | 'info';
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  importLegacy: () => Result;
}
const EventContext = createContext<EventContextType | undefined>(undefined);
export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, authenticated } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');
  const epoch = useRef(0);
  const busy = useRef(false);
  const fetching = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    clearTimeout(toastTimer.current);
    setToastMessage(message); setToastType(type);
    toastTimer.current = setTimeout(() => setToastMessage(null), 7000);
  };
  const refresh = useCallback(async () => {
    if (!authenticated || fetching.current || busy.current) return;
    fetching.current = true;
    const version = epoch.current;
    try {
      const records: EventItem[] = [];
      let page = 1, totalPages = 1;
      do {
        const result = await api.getEvents({ page: String(page), limit: '100' });
        records.push(...result.events.map(mapEvent));
        totalPages = result.pagination.totalPages;
      } while (++page <= totalPages);
      if (version !== epoch.current) return;
      setEvents(previous => records.map(record => {
        const old = previous.find(item => item.id === record.id);
        return old && JSON.stringify(old) === JSON.stringify(record) ? old : record;
      }));
      setLoading(false);

      const [facilitiesResult, equipmentResult, notificationsResult] = await Promise.allSettled([
        request<{ data: any[] }>('/bookings/facilities'),
        request<{ data: any[] }>('/bookings/equipment'),
        request<{ notifications: NotificationItem[] }>('/notifications?limit=100'),
      ]);
      if (version !== epoch.current) return;
      const errors: string[] = [];
      if (facilitiesResult.status === 'fulfilled') {
        setFacilities(facilitiesResult.value.data.map(item => ({
          ...item,
          amenities: typeof item.amenities === 'string' ? JSON.parse(item.amenities || '[]') : item.amenities || [],
          status: 'AVAILABLE',
        })));
      } else {
        errors.push(`Danh mục phòng: ${facilitiesResult.reason instanceof Error ? facilitiesResult.reason.message : 'không tải được'}`);
      }
      if (equipmentResult.status === 'fulfilled') {
        setEquipment(equipmentResult.value.data.map(item => ({ ...item, availableQuantity: item.totalQuantity })));
      } else {
        errors.push(`Danh mục thiết bị: ${equipmentResult.reason instanceof Error ? equipmentResult.reason.message : 'không tải được'}`);
      }
      if (notificationsResult.status === 'fulfilled') {
        setNotifications(notificationsResult.value.notifications || []);
      } else {
        errors.push(`Thông báo: ${notificationsResult.reason instanceof Error ? notificationsResult.reason.message : 'không tải được'}`);
      }
      setSyncError(errors.join(' · '));
    } catch (error) {
      if (version === epoch.current) {
        setSyncError(error instanceof Error ? error.message : 'Không kết nối được máy chủ');
        setLoading(false);
      }
    } finally { fetching.current = false; }
  }, [authenticated, currentUser.id]);
  useEffect(() => {
    epoch.current++;
    setEvents([]); setNotifications([]); setLoading(true); setSyncError('');
    void refresh();
    const timer = setInterval(() => void refresh(), 5000);
    const focus = () => void refresh();
    window.addEventListener('focus', focus);
    return () => { epoch.current++; clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [refresh]);

  // Never write API data over the original localStorage records. They remain a recovery source.
  const run = async (operation: () => Promise<unknown>, message: string, onError?: OperationErrorHandler): Result => {
    if (busy.current) { showToast('Đang lưu thao tác trước, vui lòng chờ.', 'info'); return false; }
    busy.current = true; epoch.current++; setSaving(true);
    try {
      await operation();
      showToast(message);
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không lưu được lên máy chủ. Vui lòng thử lại.', 'error');
      onError?.(error);
      return false;
    } finally {
      busy.current = false; setSaving(false);
      await refresh();
    }
  };
  const getEventById = (id: string) => events.find(e => e.id === id);
  const createEvent = async (data: EventMutationData, idempotencyKey?: string, onError?: OperationErrorHandler) => {
    let created: EventItem | undefined;
    await run(async () => {
      const response = await api.createEvent(data, idempotencyKey);
      created = mapEvent(response.data);
      setEvents(previous => [created!, ...previous]);
    }, 'Lưu hồ sơ thành công', onError);
    return created;
  };
  const updateEvent = (id: string, data: EventMutationData, changeNote?: string, expectedVersion?: number, onError?: OperationErrorHandler) => run(async () => {
    const response = await api.updateEvent(id, { ...data, changeNote, expectedVersion: expectedVersion ?? getEventById(id)?.currentVersion });
    const record = mapEvent(response.data);
    setEvents(previous => previous.map(e => e.id === id ? record : e));
  }, 'Cập nhật thành công', onError);
  const deleteEvent = (id: string, reason: string) => run(async () => {
    if (!reason.trim()) throw new Error('Vui lòng nhập lý do xóa hồ sơ');
    await api.deleteEvent(id, reason.trim());
    setEvents(previous => previous.filter(e => e.id !== id));
  }, 'Đã xóa mềm hồ sơ thành công');
  const restoreEvent = (id: string, reason: string) => run(async () => {
    if (!reason.trim()) throw new Error('Vui lòng nhập lý do khôi phục hồ sơ');
    await api.restoreEvent(id, reason.trim());
  }, 'Đã khôi phục hồ sơ thành công');
  const transitionEvent = (id: string, _action: string, target: EventStatus, comments?: string, reason?: string, onError?: OperationErrorHandler) => run(async () => {
    const current = (await api.getEventById(id)).data;
    const action = /^[A-Z_]+$/.test(_action) ? _action : workflowAction(current.status, target);
    if (action === 'SUBMIT') await api.submitEvent(id);
    else await api.reviewEvent(id, action, comments, reason);
  }, 'Cập nhật trạng thái thành công', onError);
  const checkFacilityAvailability = (facilityId: string, start: string, end: string, exclude?: string) => {
    const conflictingEvents = events.filter(e =>
      e.id !== exclude &&
      e.booking?.facilityId === facilityId &&
      ['PENDING', 'CONFIRMED', 'CONFLICT'].includes(e.booking.status) &&
      new Date(e.booking.startTime) < new Date(end) &&
      new Date(e.booking.endTime) > new Date(start)
    );
    return { isAvailable: conflictingEvents.length === 0, conflictEvent: conflictingEvents[0] };
  };
  const bookResource = (eventId: string, booking: EventItem['booking']) => run(async () => {
    if (!booking) throw new Error('Vui lòng chọn địa điểm tổ chức');
    await api.createBooking({ ...booking, eventId });
  }, 'Gửi yêu cầu mượn phòng thành công');
  const confirmBooking = (id: string) => run(async () => {
    const booking = getEventById(id)?.booking;
    if (!booking) throw new Error('Chưa có thông tin đăng ký phòng');
    await api.confirmBooking(booking.id);
  }, 'Đã duyệt mượn phòng');
  const rejectBooking = (id: string, _reason: string) => run(async () => {
    const booking = getEventById(id)?.booking;
    if (!booking) throw new Error('Chưa có thông tin đăng ký phòng');
    await api.rejectBooking(booking.id);
  }, 'Đã từ chối mượn phòng');
  const addHandoverRecord = (id: string, record: Omit<HandoverRecord, 'id' | 'confirmedAt'>) => run(() =>
    request(`/events/${id}/handover`, { method: 'POST', body: JSON.stringify(record) }), 'Đã lưu biên bản thành công');
  const saveReport = (id: string, data: Partial<EventReport>) => run(() =>
    request(`/events/${id}/report`, { method: 'PUT', body: JSON.stringify(data) }), 'Đã lưu báo cáo thành công');
  const saveSettlement = (id: string, data: Partial<Settlement>) => run(async () => {
    let settlement = (await api.getSettlement(id)).data;
    if (!settlement) {
      const event = getEventById(id)!;
      settlement = (await api.createSettlement({
        eventId: id,
        totalActual: data.totalActual,
        settlementDate: data.settlementDate,
        notes: data.notes,
        items: data.items ?? event.budgetItems.map(i => ({
          itemName: i.itemName,
          category: i.category,
          budgetedAmount: i.totalPrice,
          actualAmount: i.actualTotal ?? 0,
        })),
      })).data;
    } else {
      settlement = (await api.updateSettlement(settlement.id, {
        items: data.items,
        totalActual: data.totalActual,
        settlementDate: data.settlementDate,
        notes: data.notes,
      })).data;
    }
    for (const doc of data.documents || []) {
      if (!settlement.documents.some((d: any) => d.id === doc.id)) {
        await request(`/settlements/${settlement.id}/documents`, { method: 'POST', body: JSON.stringify(doc) });
      }
    }
    if (data.status === 'SUBMITTED' && ['DRAFT', 'REVISION_REQUESTED'].includes(settlement.status)) await api.submitSettlement(settlement.id);
  }, 'Đã lưu chứng từ thành công');
  const markNotificationAsRead = (id: string) => run(() => request(`/notifications/${id}/read`, { method: 'PUT' }), 'Đã đọc thông báo');
  const markAllNotificationsAsRead = () => run(() => request('/notifications/read-all', { method: 'PUT' }), 'Đã đọc tất cả thông báo');
  const resetAllData = () => showToast('Dữ liệu đang dùng chung. Không hỗ trợ khôi phục mẫu để tránh xóa hồ sơ của các máy.', 'info');
  const importLegacy = () => run(async () => {
    const saved = JSON.parse(localStorage.getItem('eventflow_events_v1') || '[]');
    const owned = saved.filter((e: EventItem) => e.createdById === currentUser.id);
    if (!owned.length) throw new Error('Không có hồ sơ cũ thuộc tài khoản này trong trình duyệt hiện tại.');
    for (const record of owned) await request('/events/import-legacy', { method: 'POST', body: JSON.stringify(record) });
  }, 'Đã nhập hồ sơ cũ thành bản nháp dùng chung. Bản gốc vẫn được giữ lại.');
  return <EventContext.Provider value={{ events, facilities, equipment, notifications, loading, saving, syncError, refresh, getEventById, createEvent, updateEvent, deleteEvent, restoreEvent, transitionEvent, checkFacilityAvailability, bookResource, confirmBooking, rejectBooking, addHandoverRecord, saveSettlement, saveReport, markNotificationAsRead, markAllNotificationsAsRead, resetAllData, toastMessage, toastType, showToast, importLegacy }}>{children}</EventContext.Provider>;
};
export const useEvents = () => {
  const value = useContext(EventContext);
  if (!value) throw new Error('useEvents must be used within EventProvider');
  return value;
};
