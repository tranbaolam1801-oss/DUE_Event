import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/helpers';
import { BudgetItem, ScheduleItem } from '../types';

export const EventEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEventById, updateEvent, facilities, saving } = useEvents();
  const { currentUser } = useAuth();

  const event = getEventById(id || '');
  const loadedVersion = useRef<number | undefined>(undefined);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objectives: '',
    targetAudience: '',
    expectedAttendees: 100,
    organizingUnit: '',
    preferredVenue: '',
    startDate: '',
    endDate: '',
    changeNote: '',
  });

  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  useEffect(() => {
    if (event) {
      loadedVersion.current = event.currentVersion;
      setFormData({
        title: event.title,
        description: event.description,
        objectives: event.objectives,
        targetAudience: event.targetAudience,
        expectedAttendees: event.expectedAttendees,
        organizingUnit: event.organizingUnit,
        preferredVenue: event.preferredVenue,
        startDate: event.startDate ? event.startDate.substring(0, 16) : '',
        endDate: event.endDate ? event.endDate.substring(0, 16) : '',
        changeNote: 'Cập nhật nội dung theo yêu cầu phản hồi',
      });
      setBudgetItems(event.budgetItems || []);
      setScheduleItems(event.scheduleItems || []);
    }
  }, [event?.id]); // Do not overwrite unsaved fields when another machine updates the event.

  if (!event) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Không tìm thấy sự kiện cần chỉnh sửa.
      </div>
    );
  }

  const isValidDateTimeString = (val?: string) => Boolean(val && typeof val === 'string' && val.trim() && !isNaN(new Date(val).getTime()));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tên sự kiện');
      return;
    }

    if (formData.startDate && formData.endDate && isValidDateTimeString(formData.startDate) && isValidDateTimeString(formData.endDate)) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start.getTime() === end.getTime()) {
        alert('Giờ kết thúc không được trùng với giờ bắt đầu');
        return;
      }
      if (end < start) {
        alert('Thời gian kết thúc phải sau thời gian bắt đầu');
        return;
      }
    }

    const startIso = isValidDateTimeString(formData.startDate)
      ? new Date(formData.startDate).toISOString()
      : (event.startDate || undefined);

    const endIso = isValidDateTimeString(formData.endDate)
      ? new Date(formData.endDate).toISOString()
      : (event.endDate || undefined);

    const success = await updateEvent(
      event.id,
      {
        title: formData.title.trim(),
        description: formData.description.trim(),
        objectives: formData.objectives.trim(),
        targetAudience: formData.targetAudience.trim(),
        expectedAttendees: Math.max(1, Number(formData.expectedAttendees) || 1),
        organizingUnit: formData.organizingUnit.trim(),
        preferredVenue: formData.preferredVenue,
        startDate: startIso,
        endDate: endIso,
        budgetItems: budgetItems || [],
        scheduleItems: scheduleItems || [],
      },
      formData.changeNote,
      loadedVersion.current
    );
    if (success) navigate(`/events/${event.id}`);
  };

  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/events/${event.id}`)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại chi tiết hồ sơ
        </button>

        <button
          type="submit" disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
        >
          <Save className="w-4 h-4" /> Lưu phiên bản mới
        </button>
      </div>

      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
        <div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {event.eventCode} (Hiện tại: v{event.currentVersion})
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Chỉnh sửa hồ sơ sự kiện</h1>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Ghi chú lý do thay đổi (để lưu nhật ký phiên bản):</label>
          <input
            type="text"
            required
            value={formData.changeNote}
            onChange={(e) => setFormData({ ...formData, changeNote: e.target.value })}
            placeholder="Ví dụ: Bổ sung CV diễn giả và cập nhật dự toán in ấn..."
            className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-amber-50/50 text-slate-800"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Tên sự kiện:</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Đơn vị tổ chức:</label>
            <input
              type="text"
              value={formData.organizingUnit}
              onChange={(e) => setFormData({ ...formData, organizingUnit: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng người dự kiến:</label>
            <input
              type="number"
              value={formData.expectedAttendees}
              onChange={(e) => setFormData({ ...formData, expectedAttendees: Number(e.target.value) })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Mục tiêu sự kiện:</label>
          <textarea
            rows={3}
            value={formData.objectives}
            onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Nội dung chi tiết:</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
          />
        </div>
      </div>
    </form>
  );
};
