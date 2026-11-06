import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Download, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { api } from '../services/api';

export const AnalyticsPage: React.FC = () => {
  const { events } = useEvents();
  const [processingData, setProcessingData] = useState<{ averageDays: number; events: Array<{ eventCode: string; title: string; days: number }> } | null>(null);
  const [processingError, setProcessingError] = useState('');

  useEffect(() => {
    let active = true;
    api.getProcessingTimes()
      .then((result) => {
        if (active) setProcessingData(result.data);
      })
      .catch((error) => {
        if (active) setProcessingError(error instanceof Error ? error.message : 'Không tải được thời gian xử lý');
      });
    return () => { active = false; };
  }, []);

  const total = events.length;
  const approved = events.filter((e) =>
    ['PERMIT_ISSUED', 'FACILITY_RESERVED', 'READY_FOR_EVENT', 'SETTLED', 'COMPLETED'].includes(e.status)
  ).length;
  const revision = events.filter((e) => e.status.includes('REVISION') || e.status === 'FACILITY_CONFLICT').length;
  const rejected = events.filter((e) => e.status.includes('REJECTED')).length;

  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const revisionRate = total > 0 ? Math.round((revision / total) * 100) : 0;
  const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;

  const processingTimeData = useMemo(() => {
    const units = new Map<string, number[]>();
    for (const record of processingData?.events || []) {
      const event = events.find((item) => item.eventCode === record.eventCode);
      if (!event || !Number.isFinite(record.days)) continue;
      const values = units.get(event.organizingUnit) || [];
      values.push(record.days);
      units.set(event.organizingUnit, values);
    }
    return Array.from(units, ([unit, days]) => ({
      unit,
      avgDays: Math.round(days.reduce((sum, value) => sum + value, 0) / days.length * 10) / 10,
    }));
  }, [events, processingData]);

  const openConflictEventCount = useMemo(() => {
    const activeBookings = events.filter((event) =>
      event.booking &&
      !['CANCELLED', 'COMPLETED'].includes(event.status) &&
      !event.status.includes('REJECTED') &&
      ['PENDING', 'TENTATIVE', 'CONFIRMED', 'CONFLICT'].includes(event.booking.status)
    );
    const conflicts = new Set(events
      .filter((event) => event.status === 'FACILITY_CONFLICT' || event.booking?.status === 'CONFLICT')
      .map((event) => event.id));
    for (let index = 0; index < activeBookings.length; index++) {
      const current = activeBookings[index];
      const currentStart = new Date(current.booking!.startTime).getTime();
      const currentEnd = new Date(current.booking!.endTime).getTime();
      for (let otherIndex = index + 1; otherIndex < activeBookings.length; otherIndex++) {
        const other = activeBookings[otherIndex];
        if (current.booking!.facilityId !== other.booking!.facilityId) continue;
        const otherStart = new Date(other.booking!.startTime).getTime();
        const otherEnd = new Date(other.booking!.endTime).getTime();
        if (currentStart < otherEnd && otherStart < currentEnd) {
          conflicts.add(current.id);
          conflicts.add(other.id);
        }
      }
    }
    return conflicts.size;
  }, [events]);

  // Budget variance data
  const budgetVarianceData = events
    .filter((e) => e.settlement)
    .map((e) => ({
      code: e.eventCode,
      budgeted: Math.round(e.settlement!.totalBudgeted / 1000000),
      actual: Math.round(e.settlement!.totalActual / 1000000),
    }));

  const pieData = [
    { name: 'Phê duyệt', value: approved, color: '#009444' },
    { name: 'Yêu cầu sửa', value: revision, color: '#F37021' },
    { name: 'Từ chối', value: rejected, color: '#DC2626' },
    { name: 'Đang xử lý / Nháp', value: total - approved - revision - rejected, color: '#005FAF' },
  ];

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã sự kiện', 'Tên sự kiện', 'Đơn vị', 'Trạng thái', 'Ngày bắt đầu', 'Dự toán'];
    const rows = events.map((e) => [
      e.eventCode,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.organizingUnit}"`,
      e.status,
      e.startDate,
      e.budgetItems.reduce((s, i) => s + i.totalPrice, 0),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EventFlow_Bao_cao_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Báo cáo và Thống kê Hiệu quả Quy trình</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Đo lường thời gian xử lý, tỷ lệ phê duyệt, xung đột tài nguyên và chênh lệch ngân sách
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Xuất dữ liệu CSV
        </button>
      </div>

      {/* KPI Rates */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Tỷ lệ Phê duyệt Thành công</div>
          <div className="text-3xl font-black text-emerald-600 mt-1">{approvalRate}%</div>
          <div className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {approved}/{total} hồ sơ đạt yêu cầu
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Tỷ lệ Cần Chỉnh sửa / Bổ sung</div>
          <div className="text-3xl font-black text-amber-500 mt-1">{revisionRate}%</div>
          <div className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {revision} hồ sơ được hoàn thiện
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Thời gian Xử lý Trung bình</div>
          <div className="text-3xl font-black text-blue-600 mt-1">
            {processingData?.events.length ? processingData.averageDays : '—'} <span className="text-sm font-normal text-slate-400">ngày</span>
          </div>
          <div className="text-[11px] text-blue-700 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {processingError || (processingData?.events.length
              ? `${processingData.events.length} hồ sơ hoàn tất có thời gian đo`
              : 'Chưa có hồ sơ hoàn tất đủ dữ liệu')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Hồ sơ đang xung đột phòng</div>
          <div className="text-3xl font-black text-[#F37021] mt-1">{openConflictEventCount}</div>
          <div className="text-[11px] text-[#D45F1A] mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Đang chờ xử lý hoặc có khung giờ chồng lấn
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Processing Time by Unit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Thời gian xử lý trung bình theo đơn vị (Ngày)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={processingTimeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="unit" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="avgDays" fill="#005FAF" name="Thực tế (ngày)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            {processingTimeData.length === 0 && !processingError && (
              <p className="mt-2 text-center text-xs text-slate-500">Chưa có đủ hồ sơ hoàn tất để tính theo đơn vị.</p>
            )}
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Tỷ lệ các nhóm kết quả thẩm định</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
