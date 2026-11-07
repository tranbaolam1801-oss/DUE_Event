import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CalendarDays, Check, CheckCircle2, Download, Eye, FileText, Plus } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate, statusLabels } from '../utils/helpers';
import { api } from '../services/api';
import { FinancialDocument, SettlementItem } from '../types';

const editableSettlementStatuses = ['DRAFT', 'REVISION_REQUESTED', 'REJECTED'];
const settlementStatusLabels: Record<string, string> = {
  DRAFT: 'Bản nháp',
  SUBMITTED: 'Đã nộp',
  REVIEWING: 'Đang kiểm tra',
  REVISION_REQUESTED: 'Yêu cầu bổ sung',
  APPROVED: 'Đã phê duyệt',
  SETTLED: 'Đã quyết toán',
  REJECTED: 'Bị từ chối',
};
const settlementEventStatuses = new Set([
  'REPORT_PENDING',
  'FINANCE_DOCUMENTS_PENDING',
  'FINANCE_REVIEW',
  'FINANCE_REVISION_REQUESTED',
  'FINANCE_APPROVAL_PENDING',
  'PAYMENT_REJECTED',
  'SETTLED',
  'COMPLETED',
]);
const MAX_UPLOAD_BYTES = 4_000_000;
const allowedDocumentExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx', '.xls', '.xlsx']);

export const SettlementPage: React.FC = () => {
  const { events, saveSettlement, transitionEvent, refresh, showToast, saving } = useEvents();
  const { currentUser } = useAuth();
  const location = useLocation();
  const requestedEventId = (location.state as { eventId?: string } | null)?.eventId;
  const settlementEvents = events.filter((event) => (
    settlementEventStatuses.has(event.status) || Boolean(event.settlement)
  ));
  const [selectedEventId, setSelectedEventId] = useState(requestedEventId || '');
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const [items, setItems] = useState<SettlementItem[]>([]);
  const [settlementDate, setSettlementDate] = useState('');
  const [settlementNotes, setSettlementNotes] = useState('');
  const [documentType, setDocumentType] = useState<FinancialDocument['documentType']>('INVOICE');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentAmount, setDocumentAmount] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentSaving, setDocumentSaving] = useState(false);
  const documentInput = useRef<HTMLInputElement>(null);
  const documentUploadRequestId = useRef<string | null>(null);
  const [documentSnapshot, setDocumentSnapshot] = useState<{ eventId: string; documents: FinancialDocument[] } | null>(null);

  useEffect(() => {
    if (!settlementEvents.some((event) => event.id === selectedEventId) && settlementEvents.length > 0) {
      setSelectedEventId(settlementEvents.find((event) => event.settlement || event.status.startsWith('FINANCE_'))?.id || settlementEvents[0].id);
    }
  }, [settlementEvents, selectedEventId]);

  useEffect(() => {
    if (!selectedEvent) return;
    const initialItems = selectedEvent.settlement?.items?.map((item) => ({ ...item })) || selectedEvent.budgetItems.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      category: item.category,
      budgetedAmount: item.totalPrice,
      actualAmount: item.actualTotal ?? 0,
      notes: item.notes || '',
    }));
    setItems(initialItems);
    setSettlementDate(selectedEvent.settlement?.settlementDate?.slice(0, 10) || '');
    setSettlementNotes(selectedEvent.settlement?.notes || '');
  }, [selectedEvent?.id, selectedEvent?.settlement?.id]);

  const settlement = selectedEvent?.settlement;
  const totalBudgeted = useMemo(() => items.reduce((sum, item) => sum + (Number(item.budgetedAmount) || 0), 0), [items]);
  const itemActualTotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.actualAmount) || 0), 0), [items]);
  const totalActual = itemActualTotal;
  const difference = totalActual - totalBudgeted;
  const canEdit = Boolean(
    selectedEvent &&
    editableSettlementStatuses.includes(settlement?.status || 'DRAFT') &&
    !['COMPLETED', 'CANCELLED'].includes(selectedEvent.status) &&
    ['BTC', 'ADMIN'].includes(currentUser.role)
  );
  const canReview = currentUser.role === 'KHTC' || currentUser.role === 'ADMIN';
  const documents = documentSnapshot?.eventId === selectedEventId
    ? documentSnapshot.documents
    : settlement?.documents || [];
  const canUploadDocuments = Boolean(
    selectedEvent &&
    ['BTC', 'ADMIN'].includes(currentUser.role) &&
    (canEdit || (settlement?.status === 'SUBMITTED' && selectedEvent.status === 'FINANCE_REVIEW'))
  );
  const documentsVerified = documents.length > 0 && documents.every((document) => document.isVerified);

  const handleSaveSettlement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEvent) return;
    if (!items.length || items.some((item) => !item.itemName.trim())) {
      showToast('Vui lòng nhập tên cho từng khoản chi.', 'error');
      return;
    }
    if (!settlementDate) {
      showToast('Vui lòng nhập ngày quyết toán.', 'error');
      return;
    }
    if (!Number.isFinite(totalActual) || totalActual < 0) {
      showToast('Tổng kinh phí thực tế phải là số hợp lệ và không âm.', 'error');
      return;
    }
    if (items.some((item) => item.actualAmount < 0 || item.budgetedAmount < 0)) {
      showToast('Số tiền không được nhỏ hơn 0.', 'error');
      return;
    }
    await saveSettlement(selectedEvent.id, {
      items: items.map((item) => ({ ...item, itemName: item.itemName.trim() })),
      totalActual,
      settlementDate,
      notes: settlementNotes.trim(),
    });
  };

  const handleAddDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedEvent || !documentFile) {
      showToast('Vui lòng chọn tệp chứng từ cần tải lên.', 'error');
      return;
    }
    if (!items.length || items.some((item) => !item.itemName.trim()) || !settlementDate) {
      showToast('Trước khi tải chứng từ, hãy nhập các khoản chi và ngày quyết toán rồi lưu biểu mẫu.', 'error');
      return;
    }
    setDocumentSaving(true);
    try {
      const idempotencyKey = documentUploadRequestId.current || crypto.randomUUID();
      documentUploadRequestId.current = idempotencyKey;
      if (settlement?.status !== 'SUBMITTED') {
        const saved = await saveSettlement(selectedEvent.id, {
          items: items.map((item) => ({ ...item, itemName: item.itemName.trim() })),
          totalActual,
          settlementDate,
          notes: settlementNotes.trim(),
        });
        if (!saved) return;
      }
      const currentSettlement = (await api.getSettlement(selectedEvent.id)).data;
      if (!currentSettlement) throw new Error('Không tìm thấy hồ sơ quyết toán vừa lưu.');
      const uploadResult = await api.uploadFinancialDocument(currentSettlement.id, {
        documentType,
        documentNumber: documentNumber.trim() || undefined,
        amount: documentAmount === '' ? undefined : Number(documentAmount),
        description: documentDescription.trim() || undefined,
      }, documentFile, idempotencyKey);
      const refreshedSettlement = await api.getSettlement(selectedEvent.id);
      const persistedDocuments = refreshedSettlement.data?.documents || [];
      if (!persistedDocuments.some((document: FinancialDocument) =>
        document.id === uploadResult.data.id && Boolean(document.filePath)
      )) {
        throw new Error('Máy chủ chưa xác nhận chứng từ có metadata và tệp đã lưu. Hãy tải lại danh sách trước khi nộp.');
      }
      setDocumentSnapshot({ eventId: selectedEvent.id, documents: persistedDocuments });
      await refresh();
      showToast('Đã tải chứng từ lên hồ sơ quyết toán.', 'success');
      setDocumentNumber('');
      setDocumentAmount('');
      setDocumentDescription('');
      setDocumentFile(null);
      documentUploadRequestId.current = null;
      if (documentInput.current) documentInput.current.value = '';
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không tải được chứng từ.', 'error');
    } finally {
      setDocumentSaving(false);
    }
  };

  const handleApproval = async () => {
    if (!selectedEvent) return;
    if (selectedEvent.status === 'FINANCE_REVIEW') {
      await transitionEvent(
        selectedEvent.id,
        'APPROVE',
        'FINANCE_APPROVAL_PENDING',
        'KHTC xác nhận bộ quyết toán hợp lệ'
      );
      return;
    }
    if (selectedEvent.status === 'FINANCE_APPROVAL_PENDING') {
      await transitionEvent(
        selectedEvent.id,
        'SETTLE',
        'SETTLED',
        'KHTC xác nhận hoàn tất quyết toán hợp lệ'
      );
    }
  };

  const updateItem = (index: number, patch: Partial<SettlementItem>) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const handleVerifyDocument = async (document: FinancialDocument) => {
    try {
      await api.verifyFinancialDocument(document.id, !document.isVerified);
      await refresh();
      showToast(document.isVerified ? 'Đã bỏ xác nhận chứng từ.' : 'Đã xác nhận chứng từ hợp lệ.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không cập nhật được trạng thái chứng từ.', 'error');
    }
  };

  const handleDownloadDocument = async (document: FinancialDocument) => {
    if (!settlement) return;
    try {
      await api.downloadFinancialDocument(
        settlement.id,
        document.id,
        document.fileName || document.documentNumber || 'chung-tu'
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không tải được chứng từ.', 'error');
    }
  };

  const handleViewDocument = async (document: FinancialDocument) => {
    if (!settlement) return;
    try {
      await api.viewFinancialDocument(settlement.id, document.id);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Không xem được chứng từ.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-5">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">Quyết toán Tài chính và Chứng từ (KHTC)</h1>
        <p className="mt-1 text-xs text-slate-500">
          Nhập chi phí thực tế, đối chiếu dự toán và xác nhận chứng từ theo hồ sơ sự kiện.
        </p>
      </header>

      <section className="grid grid-cols-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,2fr)]">
        <label htmlFor="settlement-event" className="text-xs font-semibold text-slate-700">Sự kiện cần xem / quyết toán</label>
        <select
          id="settlement-event"
          value={selectedEventId}
          onChange={(event) => setSelectedEventId(event.target.value)}
          className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-bold text-slate-800"
        >
          {settlementEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.eventCode} — {event.title} ({statusLabels[event.status]?.label || event.status})
            </option>
          ))}
        </select>
      </section>

      {selectedEvent && (
        <div className="space-y-4 sm:space-y-5">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase text-slate-400">Dự toán</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(totalBudgeted)}</div>
              <div className="mt-1 text-[11px] text-slate-500">Tổng các khoản chi trong biểu mẫu</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase text-slate-400">Tổng thực tế đã chi</div>
              <div className="mt-1 text-xl font-bold text-blue-600">{formatCurrency(totalActual)}</div>
              <div className="mt-1 text-[11px] text-slate-500">Tự cộng từ các khoản chi bên dưới</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <div className="text-xs font-semibold uppercase text-slate-400">Chênh lệch với dự toán</div>
              <div className={`mt-1 text-xl font-bold ${difference <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {formatCurrency(difference)}
              </div>
              <div className="mt-1 text-[11px] text-slate-500">Thực tế chi trừ dự toán</div>
            </div>
          </section>

          <form onSubmit={handleSaveSettlement} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Thông tin quyết toán</h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  {settlement?.status
                    ? `Trạng thái quyết toán: ${settlementStatusLabels[settlement.status] || settlement.status}`
                    : 'Chưa tạo bản ghi quyết toán'}
                </p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setItems((current) => [...current, { itemName: '', budgetedAmount: 0, actualAmount: 0, notes: '' }])}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4" /> Thêm khoản chi
                </button>
              )}
            </div>

            {items.length > 0 && (
              <div className="space-y-3">
                <div className="hidden grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(0,2fr)] gap-3 px-1 text-[11px] font-semibold text-slate-500 md:grid">
                  <span>Khoản chi</span><span>Dự toán (VNĐ)</span><span>Thực tế (VNĐ)</span><span>Ghi chú khoản chi</span>
                </div>
                {items.map((item, index) => (
                  <div key={item.id || `new-${index}`} className="grid grid-cols-1 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3 md:grid-cols-[minmax(0,2fr)_minmax(8rem,1fr)_minmax(8rem,1fr)_minmax(0,2fr)] md:items-end md:border-0 md:bg-transparent md:p-0">
                    <label className="block min-w-0">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500 md:hidden">Khoản chi</span>
                      <input
                        value={item.itemName}
                        onChange={(event) => updateItem(index, { itemName: event.target.value })}
                        disabled={!canEdit}
                        required
                        aria-label={`Tên khoản chi ${index + 1}`}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100"
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500 md:hidden">Dự toán (VNĐ)</span>
                      <input
                        type="number"
                        min="0"
                        value={item.budgetedAmount}
                        readOnly
                        aria-label={`Dự toán khoản chi ${index + 1}`}
                        className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-700"
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500 md:hidden">Thực tế (VNĐ)</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.actualAmount}
                        onChange={(event) => updateItem(index, { actualAmount: Number(event.target.value) || 0 })}
                        disabled={!canEdit}
                        required
                        aria-label={`Thực tế khoản chi ${index + 1}`}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100"
                      />
                    </label>
                    <label className="block min-w-0">
                      <span className="mb-1 block text-[11px] font-semibold text-slate-500 md:hidden">Ghi chú khoản chi</span>
                      <input
                        value={item.notes || ''}
                        onChange={(event) => updateItem(index, { notes: event.target.value })}
                        disabled={!canEdit}
                        aria-label={`Ghi chú khoản chi ${index + 1}`}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 disabled:bg-slate-100"
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {canEdit ? (
              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Ngày quyết toán</span>
                  <span className="relative block">
                    <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={settlementDate}
                      onChange={(event) => setSettlementDate(event.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-800"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-slate-700">Ghi chú quyết toán</span>
                  <textarea
                    value={settlementNotes}
                    onChange={(event) => setSettlementNotes(event.target.value)}
                    rows={2}
                    className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800"
                    placeholder="Nhập ghi chú chung cho hồ sơ quyết toán"
                  />
                </label>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Ngày quyết toán</div>
                  <div className="mt-1 text-xs text-slate-800">{settlement?.settlementDate ? formatDate(settlement.settlementDate) : 'Chưa nhập'}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-500">Ghi chú quyết toán</div>
                  <div className="mt-1 whitespace-pre-wrap text-xs text-slate-800">{settlement?.notes || 'Không có ghi chú'}</div>
                </div>
              </div>
            )}

            {canEdit && (
              <div className="flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saving ? 'Đang lưu...' : 'Lưu biểu mẫu quyết toán'}
                </button>
              </div>
            )}
          </form>

          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Chứng từ và hóa đơn</h2>
                <p className="mt-1 text-[11px] text-slate-500">Tệp được lưu theo cơ chế Storage và quyền truy cập hiện có.</p>
              </div>
              {canReview && settlement && ['FINANCE_REVIEW', 'FINANCE_APPROVAL_PENDING'].includes(selectedEvent.status) && (
                <button
                  type="button"
                  onClick={() => void handleApproval()}
                  disabled={saving || !documentsVerified}
                  title={!documentsVerified ? 'Cần có chứng từ và KHTC xác nhận hợp lệ trước khi phê duyệt.' : undefined}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {selectedEvent.status === 'FINANCE_APPROVAL_PENDING' ? 'Xác nhận hoàn tất quyết toán' : 'KHTC phê duyệt quyết toán'}
                </button>
              )}
            </div>

            {settlement?.status === 'SUBMITTED' && documents.length === 0 && (
              <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
                Đã nộp quyết toán nhưng chưa đính kèm chứng từ. Ban Tổ chức có thể bổ sung tại đây; KHTC cần kiểm tra chứng từ trước khi phê duyệt.
              </div>
            )}

            {documents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center text-xs text-slate-400">
                Chưa có chứng từ nào được tải lên.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5">Loại chứng từ</th>
                      <th className="px-3 py-2.5">Số chứng từ</th>
                      <th className="px-3 py-2.5">Nội dung</th>
                      <th className="px-3 py-2.5 text-right">Số tiền</th>
                      <th className="px-3 py-2.5 text-center">KHTC</th>
                      <th className="px-3 py-2.5 text-right">Tệp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td className="px-3 py-3 font-semibold text-slate-700">{document.documentType}</td>
                        <td className="px-3 py-3 font-mono font-bold text-blue-600">{document.documentNumber || '—'}</td>
                        <td className="px-3 py-3 text-slate-700">{document.description || document.fileName || '—'}</td>
                        <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(document.amount || 0)}</td>
                        <td className="px-3 py-3 text-center">
                          <span className={`rounded border px-2 py-0.5 text-[10px] font-bold ${document.isVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                            {document.isVerified ? 'Hợp lệ' : 'Chờ kiểm tra'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {document.filePath && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => void handleViewDocument(document)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Eye className="h-3.5 w-3.5" /> Xem
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDownloadDocument(document)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                                >
                                  <Download className="h-3.5 w-3.5" /> Tải về
                                </button>
                              </>
                            )}
                            {canReview && selectedEvent.status === 'FINANCE_REVIEW' && (
                              <button
                                type="button"
                                onClick={() => void handleVerifyDocument(document)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {document.isVerified ? 'Bỏ xác nhận' : 'Xác nhận'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {canUploadDocuments && (
              <form onSubmit={handleAddDocument} className="grid grid-cols-1 items-end gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-6">
                <label className="block min-w-0">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Loại chứng từ</span>
                  <select
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value as FinancialDocument['documentType'])}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                  >
                    <option value="INVOICE">Hóa đơn</option>
                    <option value="RECEIPT">Biên nhận</option>
                    <option value="CONTRACT">Hợp đồng</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Số chứng từ</span>
                  <input
                    value={documentNumber}
                    onChange={(event) => setDocumentNumber(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Số tiền (VNĐ)</span>
                  <input
                    type="number"
                    min="0"
                    value={documentAmount}
                    onChange={(event) => setDocumentAmount(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                  />
                </label>
                <label className="block min-w-0 lg:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Nội dung chi</span>
                  <input
                    value={documentDescription}
                    onChange={(event) => setDocumentDescription(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs"
                  />
                </label>
                <label className="block min-w-0 sm:col-span-2 lg:col-span-3">
                  <span className="mb-1 block text-[11px] font-semibold text-slate-600">Tệp chứng từ</span>
                  <input
                    ref={documentInput}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                    required
                    disabled={documentSaving}
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      if (!file) {
                        setDocumentFile(null);
                        documentUploadRequestId.current = null;
                        return;
                      }
                      const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
                      if (!allowedDocumentExtensions.has(extension)) {
                        showToast('Định dạng không hợp lệ. Chỉ chấp nhận PDF, Word, Excel, PNG hoặc JPG.', 'error');
                        event.target.value = '';
                        setDocumentFile(null);
                        documentUploadRequestId.current = null;
                        return;
                      }
                      if (!file.size || file.size > MAX_UPLOAD_BYTES) {
                        showToast('Tệp phải có dung lượng lớn hơn 0 và không vượt quá 4 MB trên Vercel.', 'error');
                        event.target.value = '';
                        setDocumentFile(null);
                        documentUploadRequestId.current = null;
                        return;
                      }
                      setDocumentFile(file);
                      documentUploadRequestId.current = crypto.randomUUID();
                    }}
                    className="block w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 p-2 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-blue-700"
                  />
                  {documentFile && (
                    <span className="mt-1 block break-all text-[10px] text-slate-500">
                      {documentFile.name} · {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </label>
                <button
                  type="submit"
                  disabled={documentSaving || saving || !documentFile}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 sm:col-span-2 lg:col-span-3"
                >
                  <FileText className="h-4 w-4" />
                  {documentSaving ? 'Đang tải...' : 'Tải chứng từ lên'}
                </button>
              </form>
            )}

            {settlement?.reviewNotes && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <div className="mb-1 font-semibold">Ghi chú KHTC</div>
                {settlement.reviewNotes}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
