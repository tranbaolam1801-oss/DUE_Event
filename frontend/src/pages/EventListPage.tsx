import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  PlusCircle,
  Eye,
  Calendar,
  FileText,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { statusLabels, formatDate } from '../utils/helpers';
import { api } from '../services/api';
import { mapEvent } from '../services/eventMapper';
import type { EventItem } from '../types';

export const EventListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { events, deleteEvent, restoreEvent } = useEvents();
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null);
  const [eventToRestore, setEventToRestore] = useState<EventItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { currentUser } = useAuth();
  const isAdmin = currentUser.role === 'ADMIN';

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [deletedEvents, setDeletedEvents] = useState<EventItem[]>([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [deletedLoadError, setDeletedLoadError] = useState('');
  const [deletedRefresh, setDeletedRefresh] = useState(0);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    if (!isAdmin && statusFilter === 'DELETED') setStatusFilter('ALL');
  }, [isAdmin, statusFilter]);

  useEffect(() => {
    if (!isAdmin || statusFilter !== 'DELETED') return;
    let active = true;
    setDeletedLoading(true);
    setDeletedLoadError('');
    const loadDeletedEvents = async () => {
      const records: EventItem[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const result = await api.getEvents({ deleted: 'only', page: String(page), limit: '100' });
        records.push(...result.events.map(mapEvent));
        totalPages = result.pagination.totalPages;
        page += 1;
      } while (active && page <= totalPages);
      if (active) setDeletedEvents(records);
    };
    loadDeletedEvents().catch((error: unknown) => {
      if (active) setDeletedLoadError(error instanceof Error ? error.message : 'Không tải được hồ sơ đã xóa.');
    }).finally(() => {
      if (active) setDeletedLoading(false);
    });
    return () => { active = false; };
  }, [isAdmin, statusFilter, deletedRefresh]);

  // Lọc danh sách hồ sơ
  const sourceEvents = statusFilter === 'DELETED' ? deletedEvents : events;
  const filteredEvents = sourceEvents.filter((ev) => {
    const matchSearch =
      ev.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.eventCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.organizingUnit.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus =
      statusFilter === 'ALL' || statusFilter === 'DELETED'
        ? true
        : statusFilter === 'PENDING'
        ? ['FACULTY_REVIEW', 'UNIVERSITY_REVIEW', 'BUDGET_REVIEW', 'FACILITY_REVIEW', 'FINANCE_REVIEW'].includes(ev.status)
        : statusFilter === 'REVISION'
        ? ev.status.includes('REVISION') || ev.status === 'FACILITY_CONFLICT'
        : statusFilter === 'APPROVED'
        ? ['PERMIT_ISSUED', 'FACILITY_RESERVED', 'READY_FOR_EVENT', 'EVENT_IN_PROGRESS'].includes(ev.status)
        : statusFilter === 'COMPLETED'
        ? ev.status === 'COMPLETED'
        : statusFilter === 'REJECTED'
        ? ev.status.includes('REJECTED') || ev.status === 'PAYMENT_REJECTED'
        : statusFilter === 'CANCELLED'
        ? ev.status === 'CANCELLED'
        : statusFilter === 'REPORT_PENDING'
        ? ev.status === 'REPORT_PENDING'
        : ev.status === statusFilter;

    const matchUnit = unitFilter === 'ALL' || ev.organizingUnit === unitFilter;

    return matchSearch && matchStatus && matchUnit;
  });

  const uniqueUnits = Array.from(new Set(sourceEvents.map((e) => e.organizingUnit)));
  const countDeleted = deletedEvents.length;

  // Đếm số lượng theo nhóm trạng thái
  const countAll = events.length;
  const countPending = events.filter((e) =>
    ['FACULTY_REVIEW', 'UNIVERSITY_REVIEW', 'BUDGET_REVIEW', 'FACILITY_REVIEW', 'FINANCE_REVIEW'].includes(e.status)
  ).length;
  const countRevision = events.filter((e) => e.status.includes('REVISION') || e.status === 'FACILITY_CONFLICT').length;
  const countApproved = events.filter((e) =>
    ['PERMIT_ISSUED', 'FACILITY_RESERVED', 'READY_FOR_EVENT', 'EVENT_IN_PROGRESS'].includes(e.status)
  ).length;
  const countCompleted = events.filter((e) => e.status === 'COMPLETED').length;
  const countRejected = events.filter((e) => e.status.includes('REJECTED') || e.status === 'PAYMENT_REJECTED').length;
  const countCancelled = events.filter((e) => e.status === 'CANCELLED').length;
  const countReportPending = events.filter((e) => e.status === 'REPORT_PENDING').length;

  return (
    <div className="space-y-3.5 sm:space-y-4 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            {currentUser.role === 'BTC' ? 'Hồ sơ sự kiện của tôi' : 'Danh mục hồ sơ sự kiện'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý và theo dõi tiến trình xét duyệt hồ sơ sự kiện sinh viên
          </p>
        </div>

        {['BTC', 'ADMIN'].includes(currentUser.role) && (
          <button
            onClick={() => navigate('/events/create')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto min-h-[38px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo hồ sơ</span>
          </button>
        )}
      </div>

      {/* Role-Smart Quick Filter: Dropdown on Mobile (<sm), Tabs on Desktop (>=sm) */}
      <div className="sm:hidden w-full">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Lọc theo trạng thái hồ sơ"
          className="w-full bg-white border border-slate-200 text-slate-800 font-semibold text-xs rounded-xl px-3 py-2.5 shadow-2xs focus:outline-hidden focus:border-[#005FAF]"
        >
          <option value="ALL">Tất cả hồ sơ ({countAll})</option>
          <option value="PENDING">Chờ xét duyệt ({countPending})</option>
          <option value="REVISION">Cần bổ sung / Sửa ({countRevision})</option>
          <option value="APPROVED">Đã cấp phép ({countApproved})</option>
          <option value="COMPLETED">Đã hoàn tất ({countCompleted})</option>
          <option value="REJECTED">Từ chối ({countRejected})</option>
          <option value="CANCELLED">Đã hủy ({countCancelled})</option>
          <option value="REPORT_PENDING">Chờ nộp báo cáo ({countReportPending})</option>
          {isAdmin && <option value="DELETED">Đã xóa ({countDeleted})</option>}
        </select>
      </div>

      <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
        {[
          { key: 'ALL', label: 'Tất cả hồ sơ', count: countAll },
          { key: 'PENDING', label: 'Chờ xét duyệt', count: countPending },
          { key: 'REVISION', label: 'Cần bổ sung / Sửa', count: countRevision },
          { key: 'APPROVED', label: 'Đã cấp phép', count: countApproved },
          { key: 'COMPLETED', label: 'Đã hoàn tất', count: countCompleted },
          { key: 'REJECTED', label: 'Từ chối', count: countRejected },
          { key: 'CANCELLED', label: 'Đã hủy', count: countCancelled },
          { key: 'REPORT_PENDING', label: 'Chờ nộp báo cáo', count: countReportPending },
          ...(isAdmin ? [{ key: 'DELETED', label: 'Đã xóa', count: countDeleted }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              statusFilter === tab.key
                ? 'bg-[#005FAF] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã hồ sơ, tên sự kiện, đơn vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs focus:outline-hidden focus:bg-white focus:border-[#005FAF] focus:ring-1 focus:ring-[#005FAF]"
            />
          </div>

          {/* Unit Filter */}
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            aria-label="Lọc theo đơn vị tổ chức"
            className="w-full sm:w-auto bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-2 focus:outline-hidden focus:border-[#005FAF] cursor-pointer max-w-full sm:max-w-[200px] truncate"
          >
            <option value="ALL">Tất cả đơn vị tổ chức</option>
            {uniqueUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium text-right sm:text-left shrink-0">
          Hiển thị <span className="font-bold text-slate-800">{filteredEvents.length}</span> / {sourceEvents.length} hồ sơ
        </div>
      </div>
      {deletedLoadError && statusFilter === 'DELETED' && (
        <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{deletedLoadError}</p>
      )}
      {deletedLoading && statusFilter === 'DELETED' && (
        <p className="text-center text-xs text-slate-500">Đang tải hồ sơ đã xóa...</p>
      )}

      {/* ── Mobile Vertical Card List (< 768px: md:hidden) ── */}
      <div className="md:hidden space-y-2.5 w-full">
        {filteredEvents.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs shadow-2xs">
            Không tìm thấy hồ sơ sự kiện nào phù hợp điều kiện lọc
          </div>
        ) : (
          filteredEvents.map((ev) => {
            const statusInfo = statusLabels[ev.status];
            return (
              <div
                key={ev.id}
                onClick={ev.deletedAt ? undefined : () => navigate(`/events/${ev.id}`)}
                className={`bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs transition-colors flex flex-col gap-2 ${ev.deletedAt ? '' : 'active:bg-slate-50 cursor-pointer'}`}
              >
                {/* Header card: Mã hồ sơ + Badge trạng thái */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#005FAF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {ev.eventCode}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border truncate max-w-[170px] ${statusInfo?.bg} ${statusInfo?.color} ${statusInfo?.border}`}
                  >
                    {ev.deletedAt ? 'Đã xóa' : statusInfo?.label}
                  </span>
                </div>

                {/* Tên sự kiện: Giới hạn tối đa 2 dòng */}
                <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug">
                  {ev.title}
                </h3>

                {/* Đơn vị tổ chức */}
                <div className="text-xs text-slate-500 truncate">
                  {ev.organizingUnit}
                </div>
                {ev.deletedAt && (
                  <p className="text-[11px] text-slate-500">
                    Lý do: {ev.deleteReason || 'Không có lý do'}
                  </p>
                )}

                {/* Footer card: Ngày tổ chức + Nút con mắt xem chi tiết */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-0.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(ev.startDate)}</span>
                  </div>

                  <div className="flex gap-1.5">
                    {!ev.deletedAt && ev.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/create?draft=${encodeURIComponent(ev.id)}`);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-pointer border border-emerald-200 transition-colors"
                        title="Tiếp tục chỉnh sửa bản nháp"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Tiếp tục</span>
                      </button>
                    )}
                    {ev.deletedAt ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteReason('');
                          setEventToRestore(ev);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-pointer border border-emerald-200 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Khôi phục</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/events/${ev.id}`);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#005FAF] text-xs font-semibold cursor-pointer border border-blue-200 transition-colors"
                          title="Xem chi tiết hồ sơ"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteReason('');
                              setEventToDelete(ev);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer border border-rose-200 transition-colors"
                            title="Xóa mềm hồ sơ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa hồ sơ</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Desktop Multi-Column Table (>= 768px: hidden md:block) ── */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-4">Mã hồ sơ</th>
                <th className="py-2.5 px-4">Tên sự kiện</th>
                <th className="py-2.5 px-4">Đơn vị tổ chức</th>
                <th className="py-2.5 px-4">Thời gian tổ chức</th>
                <th className="py-2.5 px-4 text-center">Trạng thái</th>
                <th className="py-2.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    Không tìm thấy hồ sơ sự kiện nào phù hợp điều kiện lọc
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const statusInfo = statusLabels[ev.status];
                  return (
                    <tr
                      key={ev.id}
                      onClick={ev.deletedAt ? undefined : () => navigate(`/events/${ev.id}`)}
                      className={`transition-colors group ${ev.deletedAt ? '' : 'hover:bg-blue-50/40 cursor-pointer'}`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#005FAF] whitespace-nowrap">
                        <span className="bg-blue-50 group-hover:bg-white px-2 py-0.5 rounded border border-blue-200 text-xs">
                          {ev.eventCode}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 group-hover:text-[#005FAF] line-clamp-2 transition-colors">
                          {ev.title}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {ev.organizingUnit}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(ev.startDate)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo?.bg} ${statusInfo?.color} ${statusInfo?.border}`}
                        >
                          {ev.deletedAt ? 'Đã xóa' : statusInfo?.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {!ev.deletedAt && ev.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => navigate(`/events/create?draft=${encodeURIComponent(ev.id)}`)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                              title="Tiếp tục chỉnh sửa bản nháp"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Tiếp tục</span>
                            </button>
                          )}
                          {ev.deletedAt ? (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteReason('');
                                setEventToRestore(ev);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Khôi phục</span>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => navigate(`/events/${ev.id}`)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[#005FAF] bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
                                title="Xem chi tiết hồ sơ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Chi tiết</span>
                              </button>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteReason('');
                                    setEventToDelete(ev);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                                  title="Xóa mềm hồ sơ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Xóa hồ sơ</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {(eventToDelete || eventToRestore) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-admin-action-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
          >
            <h2 id="event-admin-action-title" className="text-base font-bold text-slate-900">
              {eventToDelete ? 'Xóa hồ sơ sự kiện' : 'Khôi phục hồ sơ sự kiện'}
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              {eventToDelete?.title || eventToRestore?.title}
            </p>
            <label className="mt-4 block text-xs font-semibold text-slate-700">
              Lý do <span className="text-rose-600">*</span>
              <textarea
                autoFocus
                value={deleteReason}
                onChange={(event) => setDeleteReason(event.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm font-normal focus:border-blue-500 focus:outline-none"
                placeholder={eventToDelete ? 'Nhập lý do xóa hồ sơ' : 'Nhập lý do khôi phục hồ sơ'}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setEventToDelete(null);
                  setEventToRestore(null);
                  setDeleteReason('');
                }}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={deleting || !deleteReason.trim()}
                onClick={async () => {
                  setDeleting(true);
                  const success = eventToDelete
                    ? await deleteEvent(eventToDelete.id, deleteReason)
                    : eventToRestore
                      ? await restoreEvent(eventToRestore.id, deleteReason)
                      : false;
                  setDeleting(false);
                  if (success) {
                    setEventToDelete(null);
                    setEventToRestore(null);
                    setDeleteReason('');
                    setDeletedRefresh((value) => value + 1);
                  }
                }}
                className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 ${eventToDelete ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
              >
                {deleting ? 'Đang xử lý...' : eventToDelete ? 'Xóa mềm hồ sơ' : 'Khôi phục hồ sơ'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
