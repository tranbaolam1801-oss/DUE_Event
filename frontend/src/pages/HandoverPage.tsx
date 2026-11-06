import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, AlertTriangle, Building, Clock, FileText, Send } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime } from '../utils/helpers';

export const HandoverPage: React.FC = () => {
  const { events, addHandoverRecord } = useEvents();
  const { currentUser } = useAuth();

  // Find events in handover or return pending stages
  const pendingEvents = events.filter((e) =>
    ['READY_FOR_EVENT', 'FACILITY_HANDED_OVER', 'FACILITY_RETURN_PENDING', 'FACILITY_INSPECTION'].includes(e.status)
  );

  const [selectedEventId, setSelectedEventId] = useState('');
  const [recordType, setRecordType] = useState<'PRE_EVENT' | 'POST_EVENT'>('PRE_EVENT');
  const [facilityCondition, setFacilityCondition] = useState('');
  const [equipmentNotes, setEquipmentNotes] = useState('');
  const [handoverOfficer, setHandoverOfficer] = useState(currentUser.role === 'CSVC' ? currentUser.fullName : '');
  const [hasIncident, setHasIncident] = useState(false);
  const [incidentDetails, setIncidentDetails] = useState('');
  const [formError, setFormError] = useState('');

  const effectiveEventId = pendingEvents.some((event) => event.id === selectedEventId)
    ? selectedEventId
    : pendingEvents[0]?.id || '';
  const selectedEvent = events.find((e) => e.id === effectiveEventId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveEventId || !facilityCondition.trim() || !equipmentNotes.trim() || !handoverOfficer.trim() || (hasIncident && !incidentDetails.trim())) {
      setFormError('Vui lòng chọn sự kiện và ghi nhận đầy đủ kết quả kiểm tra thực tế.');
      return;
    }
    setFormError('');

    addHandoverRecord(effectiveEventId, {
      type: recordType,
      handoverByName: handoverOfficer.trim(),
      receivedByName: selectedEvent?.contactPerson || 'Đại diện BTC',
      facilityCondition,
      equipmentNotes,
      hasIncident,
      incidentDetails: hasIncident ? incidentDetails : undefined,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Bàn giao và Nghiệm thu Cơ sở vật chất</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quy trình lập biên bản bàn giao phòng/thiết bị trước sự kiện và nghiệm thu hoàn trả sau sự kiện
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Create Handover Record */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-blue-600" />
            <span>Lập biên bản bàn giao / Nghiệm thu mới</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn sự kiện thực hiện:</label>
            <select
              value={effectiveEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              {pendingEvents.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.eventCode} — {ev.title} ({ev.organizingUnit})
                </option>
              ))}
            </select>
            {pendingEvents.length === 0 && <p className="text-[11px] text-slate-500 mt-1">Hiện không có sự kiện ở giai đoạn bàn giao hoặc nghiệm thu.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại biên bản:</label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                <option value="PRE_EVENT">1. Bàn giao trước sự kiện</option>
                <option value="POST_EVENT">2. Nghiệm thu hoàn trả sau sự kiện</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Người lập biên bản:</label>
              <input
                type="text"
                required
                value={handoverOfficer}
                onChange={(e) => setHandoverOfficer(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tình trạng thực tế hội trường / phòng:</label>
            <textarea
              rows={2}
              value={facilityCondition}
              onChange={(e) => setFacilityCondition(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kiểm tra số lượng thiết bị:</label>
            <textarea
              rows={2}
              value={equipmentNotes}
              onChange={(e) => setEquipmentNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          {/* Incident reporting toggle */}
          {recordType === 'POST_EVENT' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-900">
                <input
                  type="checkbox"
                  checked={hasIncident}
                  onChange={(e) => setHasIncident(e.target.checked)}
                  className="rounded text-amber-600"
                />
                <span>Có phát sinh sự cố / hư hỏng thiết bị hoặc mất mát tài sản?</span>
              </label>

              {hasIncident && (
                <div>
                  <textarea
                    rows={2}
                    value={incidentDetails}
                    onChange={(e) => setIncidentDetails(e.target.value)}
                    placeholder="Mô tả cụ thể thiết bị hư hỏng, mức độ và phương án xử lý bồi hoàn..."
                    className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-white"
                  />
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex justify-end">
            {formError && <p role="alert" className="mr-auto self-center text-xs text-rose-600">{formError}</p>}
            <button
              type="submit"
              disabled={!effectiveEventId}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer min-h-[40px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" /> Xác nhận ký biên bản điện tử
            </button>
          </div>
        </form>

        {/* Right Info: Selected Event Overview */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thông tin sự kiện được chọn</h3>

          {selectedEvent ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedEvent.eventCode}</span>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedEvent.title}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-slate-600">
                <div>Địa điểm: <span className="font-semibold text-slate-800">{selectedEvent.preferredVenue}</span></div>
                <div>Đơn vị: <span className="font-semibold text-slate-800">{selectedEvent.organizingUnit}</span></div>
                <div>Đại diện nhận: <span className="font-semibold text-slate-800">{selectedEvent.contactPerson}</span></div>
                <div>Điện thoại: <span className="font-semibold text-slate-800">{selectedEvent.contactPhone}</span></div>
              </div>

              {selectedEvent.handover && selectedEvent.handover.length > 0 && (
                <div>
                  <div className="font-bold text-slate-700 mb-2">Các biên bản đã ký:</div>
                  <div className="space-y-2">
                    {selectedEvent.handover.map((h) => (
                      <div key={h.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-[11px]">
                        <div className="font-bold text-slate-800">
                          {h.type === 'PRE_EVENT' ? 'Bàn giao trước sự kiện' : 'Nghiệm thu hoàn trả'}
                        </div>
                        <div className="text-slate-400 mt-0.5">{formatDateTime(h.confirmedAt)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-slate-400">Chưa chọn sự kiện</div>
          )}
        </div>
      </div>
    </div>
  );
};
