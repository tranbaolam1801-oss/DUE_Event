import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  startOfDay,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  Building,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  Filter,
  X,
  ExternalLink,
  Users,
  Plus,
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDateTime, formatDate, statusLabels } from '../utils/helpers';
import type { ResourceBooking } from '../types';

type ViewMode = 'month' | 'week' | 'day';
type BookingStatusFilter = 'ALL' | ResourceBooking['status'];

interface CalendarBooking extends ResourceBooking {
  eventId: string;
  eventCode: string;
  eventTitle: string;
  organizingUnit: string;
  eventStatus: string;
  hasOverlap: boolean;
  overlapWith: string[];
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_START_HOUR = 0;
const DAY_END_HOUR = 24;
const HOUR_HEIGHT = 56;
const MONTH_MAX_VISIBLE = 3;

const OCCUPYING_STATUSES: ResourceBooking['status'][] = ['PENDING', 'CONFIRMED', 'CONFLICT'];

function formatTimeRange(start: string, end: string): string {
  try {
    return `${format(parseISO(start), 'HH:mm')} – ${format(parseISO(end), 'HH:mm')}`;
  } catch {
    return '--';
  }
}

function formatBookingTimeForDay(startIso: string, endIso: string, currentDay: Date): string {
  try {
    const start = parseISO(startIso);
    const end = parseISO(endIso);

    if (isSameDay(start, end)) {
      if (start.getTime() === end.getTime()) {
        return `${format(start, 'HH:mm')} (0h)`;
      }
      return `${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`;
    }

    if (isSameDay(currentDay, start)) {
      return `Bắt đầu ${format(start, 'HH:mm')}`;
    }
    if (isSameDay(currentDay, end)) {
      return `Đến ${format(end, 'HH:mm')}`;
    }
    return `Cả ngày (${format(start, 'dd/MM')}–${format(end, 'dd/MM')})`;
  } catch {
    return '--';
  }
}

function bookingStyle(b: CalendarBooking): { bg: string; border: string; text: string; chip: string } {
  if (b.hasOverlap || b.status === 'CONFLICT') {
    return {
      bg: 'bg-rose-50',
      border: 'border-rose-300',
      text: 'text-rose-900',
      chip: 'bg-rose-100 text-rose-800 border-rose-300',
    };
  }
  if (b.status === 'CONFIRMED') {
    return {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      text: 'text-blue-900',
      chip: 'bg-blue-100 text-[#005FAF] border-blue-300',
    };
  }
  if (b.status === 'PENDING') {
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-300',
      text: 'text-orange-900',
      chip: 'bg-orange-100 text-[#D45F1A] border-orange-300',
    };
  }
  return {
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    text: 'text-slate-700',
    chip: 'bg-slate-100 text-slate-600 border-slate-300',
  };
}

function statusLabel(status: ResourceBooking['status'], hasOverlap: boolean): string {
  if (hasOverlap || status === 'CONFLICT') return 'Xung đột lịch';
  if (status === 'CONFIRMED') return 'Đã xác nhận';
  if (status === 'PENDING') return 'Chờ duyệt';
  if (status === 'REJECTED') return 'Đã từ chối';
  return status;
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

function eventTopHeight(startIso: string, endIso: string, day: Date): { top: number; height: number } | null {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const dayBase = startOfDay(day);
  const nextDay = addDays(dayBase, 1);
  const visibleStart = start > dayBase ? start : dayBase;
  const visibleEnd = end < nextDay ? end : nextDay;
  if (visibleStart >= visibleEnd) return null;
  const totalMinutes = 24 * 60;
  const startOffset = differenceInMinutes(visibleStart, dayBase);
  const duration = differenceInMinutes(visibleEnd, visibleStart);
  const top = (startOffset / totalMinutes) * ((DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT);
  const height = Math.min(
    (duration / totalMinutes) * ((DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT),
    (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT - top
  );
  return { top, height: Math.max(height, 18) };
}

export const ResourceCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { events, facilities } = useEvents();
  const { currentUser } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [cursorDate, setCursorDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedFacility, setSelectedFacility] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const calendarBookings = useMemo(() => {
    const base = events
      .filter((e) => e.booking && e.status !== 'CANCELLED' && !e.status.includes('REJECTED'))
      .map((e) => ({
        ...e.booking!,
        eventId: e.id,
        eventCode: e.eventCode,
        eventTitle: e.title,
        organizingUnit: e.organizingUnit,
        eventStatus: e.status,
        hasOverlap: false,
        overlapWith: [] as string[],
      }))
      .filter((b) => selectedFacility === 'ALL' || b.facilityId === selectedFacility)
      .filter((b) => statusFilter === 'ALL' || b.status === statusFilter);

    // Phát hiện trùng lịch theo facility (cùng logic chiếm dụng PENDING/CONFIRMED/CONFLICT)
    const withConflict = base.map((b) => {
      if (!OCCUPYING_STATUSES.includes(b.status)) {
        return b;
      }
      const start = parseISO(b.startTime);
      const end = parseISO(b.endTime);
      const conflicts = base.filter((other) => {
        if (other.id === b.id) return false;
        if (other.facilityId !== b.facilityId) return false;
        if (!OCCUPYING_STATUSES.includes(other.status)) return false;
        return overlaps(start, end, parseISO(other.startTime), parseISO(other.endTime));
      });
      return {
        ...b,
        hasOverlap: conflicts.length > 0 || b.status === 'CONFLICT',
        overlapWith: conflicts.map((c) => `${c.eventCode} – ${c.eventTitle}`),
      };
    });

    return withConflict.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [events, selectedFacility, statusFilter]);

  const bookingsOnDay = useCallback(
    (day: Date) => {
      const dayStart = startOfDay(day);
      const dayEnd = addDays(dayStart, 1);
      return calendarBookings.filter((booking) =>
        parseISO(booking.startTime) < dayEnd && parseISO(booking.endTime) > dayStart
      );
    },
    [calendarBookings]
  );

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(cursorDate);
    const monthEnd = endOfMonth(cursorDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursorDate]);

  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(cursorDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: endOfWeek(cursorDate, { weekStartsOn: 1 }) });
  }, [cursorDate]);

  const visibleDays = viewMode === 'month' ? monthDays : viewMode === 'week' ? weekDays : [selectedDate];
  const visibleStart = startOfDay(visibleDays[0] || cursorDate);
  const visibleEnd = addDays(startOfDay(visibleDays[visibleDays.length - 1] || cursorDate), 1);
  const visibleBookings = useMemo(() => {
    return calendarBookings.filter((b) =>
      overlaps(parseISO(b.startTime), parseISO(b.endTime), visibleStart, visibleEnd)
    );
  }, [calendarBookings, visibleStart, visibleEnd]);
  const conflictCount = calendarBookings.filter((booking) =>
    booking.hasOverlap && overlaps(parseISO(booking.startTime), parseISO(booking.endTime), visibleStart, visibleEnd)
  ).length;

  const hours = useMemo(
    () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR }, (_, i) => DAY_START_HOUR + i),
    []
  );

  const goPrev = () => {
    if (viewMode === 'month') setCursorDate((d) => subMonths(d, 1));
    else if (viewMode === 'week') setCursorDate((d) => subWeeks(d, 1));
    else setCursorDate((d) => subDays(d, 1));
  };

  const goNext = () => {
    if (viewMode === 'month') setCursorDate((d) => addMonths(d, 1));
    else if (viewMode === 'week') setCursorDate((d) => addWeeks(d, 1));
    else setCursorDate((d) => addDays(d, 1));
  };

  const goToday = () => {
    const today = new Date();
    setCursorDate(today);
    setSelectedDate(today);
  };

  const headerTitle = useMemo(() => {
    if (viewMode === 'month') return format(cursorDate, "'Tháng' M / yyyy", { locale: vi });
    if (viewMode === 'week') {
      const ws = startOfWeek(cursorDate, { weekStartsOn: 1 });
      const we = endOfWeek(cursorDate, { weekStartsOn: 1 });
      return `${format(ws, 'dd/MM')} – ${format(we, 'dd/MM/yyyy')}`;
    }
    return format(cursorDate, 'EEEE, dd/MM/yyyy', { locale: vi });
  }, [cursorDate, viewMode]);

  // Đóng modal: Escape + click ngoài
  useEffect(() => {
    if (!selectedBooking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBooking(null);
    };
    const onPointer = (e: PointerEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setSelectedBooking(null);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [selectedBooking]);

  const openBooking = (b: CalendarBooking, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedBooking(b);
  };

  const selectDay = (day: Date) => {
    setSelectedDate(day);
    setCursorDate(day);
  };

  const renderTimeGrid = (days: Date[]) => (
    <div className="overflow-x-auto">
      <div
        className="min-w-[640px] grid"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {/* Header row */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200" />
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`sticky top-0 z-10 bg-white border-b border-slate-200 px-1 py-2 text-center ${
              isToday(day) ? 'bg-blue-50/80' : ''
            } ${isSameDay(day, selectedDate) ? 'ring-1 ring-inset ring-[#005FAF]/40' : ''}`}
          >
            <div className="text-[10px] font-bold uppercase text-slate-400">{WEEKDAY_LABELS[(day.getDay() + 6) % 7]}</div>
            <button
              type="button"
              onClick={() => {
                selectDay(day);
                setViewMode('day');
              }}
              className={`mt-0.5 w-7 h-7 mx-auto rounded-full text-xs font-bold flex items-center justify-center cursor-pointer ${
                isToday(day) ? 'bg-[#005FAF] text-white' : 'text-slate-800 hover:bg-slate-100'
              }`}
            >
              {format(day, 'd')}
            </button>
          </div>
        ))}

        {/* Time + columns */}
        <div className="relative border-r border-slate-100" style={{ height: hours.length * HOUR_HEIGHT }}>
          {hours.map((h) => (
            <div
              key={h}
              className="absolute left-0 right-0 text-[10px] text-slate-400 font-medium pr-1 text-right"
              style={{ top: (h - DAY_START_HOUR) * HOUR_HEIGHT - 6 }}
            >
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {days.map((day) => {
          const dayBookings = bookingsOnDay(day);
          return (
            <div
              key={`col-${day.toISOString()}`}
              className={`relative border-r border-slate-100 ${isToday(day) ? 'bg-blue-50/20' : ''}`}
              style={{ height: hours.length * HOUR_HEIGHT }}
              onClick={() => selectDay(day)}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-slate-100"
                  style={{ top: (h - DAY_START_HOUR) * HOUR_HEIGHT }}
                />
              ))}
              {dayBookings.map((b) => {
                const position = eventTopHeight(b.startTime, b.endTime, day);
                if (!position) return null;
                const { top, height } = position;
                const style = bookingStyle(b);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={(e) => openBooking(b, e)}
                    title={`${b.eventTitle} · ${b.facilityName}`}
                    className={`absolute left-0.5 right-0.5 z-[1] overflow-hidden rounded-md border px-1 py-0.5 text-left shadow-xs cursor-pointer hover:brightness-95 ${style.bg} ${style.border} ${style.text}`}
                    style={{ top, height }}
                  >
                    <div className="text-[10px] font-bold truncate leading-tight">{formatBookingTimeForDay(b.startTime, b.endTime, day)}</div>
                    <div className="text-[10px] font-semibold truncate leading-tight">{b.eventTitle}</div>
                    {height > 40 && (
                      <div className="text-[9px] truncate opacity-80">{b.facilityName}</div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lịch Cơ sở vật chất và Hội trường</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem lịch đặt theo tháng, tuần, ngày — phát hiện xung đột thời gian thực
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['BTC', 'CSVC', 'ADMIN'].includes(currentUser.role) && (
            <button
              type="button"
              onClick={() => navigate('/events/create')}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Đăng ký CSVC mới</span>
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedFacility}
              onChange={(e) => setSelectedFacility(e.target.value)}
              aria-label="Lọc theo hội trường hoặc phòng"
              className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:border-[#005FAF] cursor-pointer shadow-2xs max-w-[220px]"
            >
              <option value="ALL">Tất cả hội trường và phòng</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.capacity} chỗ)
                </option>
              ))}
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatusFilter)}
            aria-label="Lọc theo trạng thái lịch đặt"
            className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:border-[#005FAF] cursor-pointer shadow-2xs"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="CONFLICT">Xung đột</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Conflict banner */}
      {conflictCount > 0 && (
        <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Phát hiện {conflictCount} lịch đặt bị xung đột</span>
            <span className="text-rose-700">
              {' '}
              (cùng hội trường/phòng và khoảng thời gian giao nhau). Các khối màu đỏ trên lịch cần được xem xét.
            </span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className="w-5 h-5 text-[#005FAF] shrink-0" />
          <span className="text-sm sm:text-base font-bold text-slate-800 truncate capitalize">{headerTitle}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
            {([
              ['month', 'Tháng'],
              ['week', 'Tuần'],
              ['day', 'Ngày'],
            ] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 cursor-pointer transition-colors ${
                  viewMode === mode
                    ? 'bg-[#005FAF] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrev}
              aria-label="Kỳ trước"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-700"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Kỳ sau"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#005FAF]" /> Đã xác nhận
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#F37021]" /> Chờ duyệt
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" /> Xung đột
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" /> Từ chối / khác
        </span>
        <span className="text-slate-400 ml-auto">{visibleBookings.length} lịch đặt trong kỳ đang xem</span>
      </div>

      {/* Calendar body */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {viewMode === 'month' && (
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {WEEKDAY_LABELS.map((d) => (
                  <div key={d} className="px-2 py-2 text-center text-[11px] font-bold uppercase text-slate-500 tracking-wide">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 auto-rows-fr">
                {monthDays.map((day) => {
                  const dayItems = bookingsOnDay(day);
                  const visible = dayItems.slice(0, MONTH_MAX_VISIBLE);
                  const more = dayItems.length - visible.length;
                  const inMonth = isSameMonth(day, cursorDate);
                  const selected = isSameDay(day, selectedDate);
                  const today = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => selectDay(day)}
                      className={`min-h-[110px] border-b border-r border-slate-100 p-1.5 cursor-pointer transition-colors hover:bg-slate-50/80 ${
                        !inMonth ? 'bg-slate-50/60' : 'bg-white'
                      } ${selected ? 'ring-2 ring-inset ring-[#005FAF]/50 bg-blue-50/40' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                            today
                              ? 'bg-[#005FAF] text-white'
                              : inMonth
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {format(day, 'd')}
                        </span>
                        {dayItems.some((b) => b.hasOverlap) && (
                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {visible.map((b) => {
                          const style = bookingStyle(b);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={(e) => openBooking(b, e)}
                              className={`w-full text-left truncate rounded px-1 py-0.5 text-[10px] font-semibold border cursor-pointer ${style.bg} ${style.border} ${style.text}`}
                            >
                              {formatBookingTimeForDay(b.startTime, b.endTime, day)} · {b.facilityName}
                            </button>
                          );
                        })}
                        {more > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              selectDay(day);
                              setViewMode('day');
                            }}
                            className="w-full text-left text-[10px] font-bold text-[#005FAF] px-1 hover:underline cursor-pointer"
                          >
                            +{more} lịch khác
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'week' && renderTimeGrid(weekDays)}

        {viewMode === 'day' && renderTimeGrid([startOfDay(cursorDate)])}
      </div>

      {/* Selected day summary (month view helper) */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-800">
              Lịch ngày {format(selectedDate, 'dd/MM/yyyy')}
            </h2>
            <button
              type="button"
              onClick={() => {
                setCursorDate(selectedDate);
                setViewMode('day');
              }}
              className="text-xs font-semibold text-[#005FAF] hover:underline cursor-pointer"
            >
              Xem chế độ Ngày →
            </button>
          </div>
          {bookingsOnDay(selectedDate).length === 0 ? (
            <p className="text-xs text-slate-400">Không có lịch đặt trong ngày này</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {bookingsOnDay(selectedDate).map((b) => {
                const style = bookingStyle(b);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => openBooking(b)}
                    className={`text-left rounded-xl border p-3 hover:shadow-sm transition-shadow cursor-pointer ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold text-[#005FAF]">{b.eventCode}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${style.chip}`}>
                        {statusLabel(b.status, b.hasOverlap)}
                      </span>
                    </div>
                    <div className={`text-xs font-bold line-clamp-1 ${style.text}`}>{b.eventTitle}</div>
                    <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 shrink-0" />
                        {formatTimeRange(b.startTime, b.endTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="w-3 h-3 shrink-0" />
                        <span className="truncate">{b.facilityName}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/45 backdrop-blur-xs">
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
            className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-[#003D70] text-white">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200">Chi tiết lịch đặt</div>
                <h3 id="booking-detail-title" className="text-sm font-bold mt-0.5">
                  {selectedBooking.eventCode}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                aria-label="Đóng"
                className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Tên sự kiện</div>
                <div className="text-sm font-bold text-slate-900">{selectedBooking.eventTitle}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Ngày tổ chức</div>
                  <div className="font-semibold text-slate-800">{formatDate(selectedBooking.startTime)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Trạng thái đặt chỗ</div>
                  <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border ${bookingStyle(selectedBooking).chip}`}>
                    {statusLabel(selectedBooking.status, selectedBooking.hasOverlap)}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Thời gian</div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Clock className="w-3.5 h-3.5 text-[#F37021]" />
                  {formatDateTime(selectedBooking.startTime)} → {formatDateTime(selectedBooking.endTime)}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Hội trường / phòng</div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Building className="w-3.5 h-3.5 text-[#005FAF]" />
                  {selectedBooking.facilityName}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Đơn vị đăng ký</div>
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  {selectedBooking.organizingUnit}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Trạng thái hồ sơ sự kiện</div>
                <div className="font-semibold text-slate-800">
                  {statusLabels[selectedBooking.eventStatus as keyof typeof statusLabels]?.label || selectedBooking.eventStatus}
                </div>
              </div>

              {(selectedBooking.hasOverlap || selectedBooking.status === 'CONFLICT') && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <div className="flex items-start gap-1.5 font-bold mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    Cảnh báo xung đột lịch
                  </div>
                  {selectedBooking.overlapWith.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      {selectedBooking.overlapWith.map((name) => (
                        <li key={name}>Trùng với: {name}</li>
                      ))}
                    </ul>
                  ) : selectedBooking.conflictDetails ? (
                    <p className="text-[11px]">{selectedBooking.conflictDetails}</p>
                  ) : (
                    <p className="text-[11px]">Lịch đặt đang ở trạng thái CONFLICT trên hệ thống.</p>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-white cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = selectedBooking.eventId;
                  setSelectedBooking(null);
                  navigate(`/events/${id}`);
                }}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-[#005FAF] hover:bg-[#004A8A] text-white flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Xem hồ sơ sự kiện
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
