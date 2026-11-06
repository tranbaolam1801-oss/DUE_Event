import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Receipt,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import { formatDateTime } from '../utils/helpers';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { events } = useEvents();

  // Metrics
  const totalEvents = events.length;
  const pendingApproval = events.filter((e) =>
    ['FACULTY_REVIEW', 'UNIVERSITY_REVIEW', 'BUDGET_REVIEW', 'FACILITY_REVIEW', 'FINANCE_REVIEW'].includes(e.status)
  ).length;
  const needsRevision = events.filter((e) => e.status.includes('REVISION') || e.status === 'FACILITY_CONFLICT').length;
  const readyOrInProgress = events.filter((e) => ['READY_FOR_EVENT', 'EVENT_IN_PROGRESS', 'PERMIT_ISSUED'].includes(e.status)).length;
  const completed = events.filter((e) => e.status === 'COMPLETED').length;

  // Chart data: Distribution by status groups
  const statusGroupData = [
    { name: 'Đang duyệt', count: pendingApproval, color: '#005FAF' },
    { name: 'Yêu cầu sửa', count: needsRevision, color: '#F37021' },
    { name: 'Đã cấp phép / Sẵn sàng', count: readyOrInProgress, color: '#1A78CD' },
    { name: 'Hoàn tất', count: completed, color: '#009444' },
    { name: 'Khác (Nháp/Nghiệm thu)', count: totalEvents - (pendingApproval + needsRevision + readyOrInProgress + completed), color: '#64748B' },
  ];

  // Chart data: Monthly events
  const monthlyData = [
    { month: 'T7', count: 2 },
    { month: 'T8', count: 3 },
    { month: 'T9', count: 5 },
    { month: 'T10', count: 9 },
    { month: 'T11', count: 6 },
    { month: 'T12', count: 4 },
  ];

  // Recent workflow events
  const recentHistory = events
    .flatMap((e) =>
      e.history.map((h) => ({
        ...h,
        eventTitle: e.title,
        eventCode: e.eventCode,
        eventId: e.id,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Tiêu đề trang gọn gàng & nút thao tác trực tiếp */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Tổng quan hệ thống
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ tiếp nhận, xét duyệt và cấp phép tổ chức sự kiện
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['BTC', 'ADMIN'].includes(currentUser.role) && (
            <button
              onClick={() => navigate('/events/create')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Tạo sự kiện mới</span>
            </button>
          )}
          <button
            onClick={() => navigate('/ai-review')}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#D45F1A] border border-orange-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F37021]" />
            <span>Rà soát AI</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Tổng số hồ sơ</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5">{totalEvents}</div>
            <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5 font-semibold">
              <TrendingUp className="w-3 h-3" /> +3 sự kiện tháng này
            </div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-50 text-[#005FAF] flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Đang chờ xét duyệt</div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 mt-0.5">{pendingApproval}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Qua 3 cấp thẩm định</div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 truncate max-w-[120px] sm:max-w-none">Chỉnh sửa / Trùng lịch</div>
            <div className="text-xl sm:text-2xl font-bold text-orange-600 mt-0.5">{needsRevision}</div>
            <div className="text-[10px] text-orange-700 mt-0.5 font-medium">Cần xử lý kịp thời</div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500">Đã hoàn tất toàn bộ</div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 mt-0.5">{completed}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5 font-medium truncate">Nghiệm thu và quyết toán</div>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Status Distribution */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>Phân bố trạng thái hồ sơ</span>
            <span className="text-[11px] font-normal text-slate-400">Thời gian thực</span>
          </h2>
          <div className="h-52 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusGroupData}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  innerRadius={42}
                  paddingAngle={3}
                >
                  {statusGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2.5 border-t border-slate-100 text-[10px] sm:text-[11px]">
            {statusGroupData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="font-bold text-slate-800">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Events Bar Chart */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs lg:col-span-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
            <span>Số lượng sự kiện theo tháng</span>
            <span className="text-[11px] font-normal text-slate-400">Năm học 2024 - 2025</span>
          </h2>
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#005FAF" radius={[5, 5, 0, 0]} name="Số sự kiện" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Workflow Activity & Priority Action Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Recent Activity Feed */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800">Nhật ký xử lý gần đây</h2>
            <button
              onClick={() => navigate('/events')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {recentHistory.map((h) => (
              <div
                key={h.id}
                onClick={() => navigate(`/events/${h.eventId}`)}
                className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 text-[#005FAF] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  {h.actorName?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 truncate">{h.actorName}</span>
                    <span className="text-[10px] text-slate-400">{formatDateTime(h.timestamp)}</span>
                  </div>
                  <div className="text-xs text-blue-700 font-medium line-clamp-1">
                    {h.eventCode} — {h.eventTitle}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">{h.action}</div>
                  {h.comments && (
                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg mt-1 border border-slate-100">
                      "{h.comments}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Nav / Key Actions */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 mb-3">Phím tắt thao tác nhanh</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <div
                onClick={() => navigate('/events/create')}
                className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition-all cursor-pointer"
              >
                <PlusCircle className="w-5 h-5 text-blue-600 mb-1.5" />
                <div className="font-bold text-xs text-blue-900">Nộp hồ sơ sự kiện</div>
                <div className="text-[10px] text-blue-700 mt-0.5">Biểu mẫu 5 bước chuẩn hóa</div>
              </div>

              <div
                onClick={() => navigate('/approvals')}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/70 transition-all cursor-pointer"
              >
                <Clock className="w-5 h-5 text-amber-600 mb-1.5" />
                <div className="font-bold text-xs text-amber-900">Hàng đợi xét duyệt</div>
                <div className="text-[10px] text-amber-700 mt-0.5">{pendingApproval} hồ sơ chờ xử lý</div>
              </div>

              <div
                onClick={() => navigate('/calendar')}
                className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/70 transition-all cursor-pointer"
              >
                <Building2 className="w-5 h-5 text-[#F37021] mb-1.5" />
                <div className="font-bold text-xs text-orange-900">Lịch hội trường</div>
                <div className="text-[10px] text-orange-700 mt-0.5">Kiểm tra trùng phòng và CSVC</div>
              </div>

              <div
                onClick={() => navigate('/settlements')}
                className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 transition-all cursor-pointer"
              >
                <Receipt className="w-5 h-5 text-emerald-600 mb-1.5" />
                <div className="font-bold text-xs text-emerald-900">Quyết toán tài chính</div>
                <div className="text-[10px] text-emerald-700 mt-0.5">Hóa đơn và chứng từ KHTC</div>
              </div>
            </div>
          </div>

          <div className="mt-3.5 p-3 rounded-xl bg-[#003D70] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#F37021] shrink-0" />
              <div>
                <div className="text-xs font-bold">Trợ lý AI Đánh giá Hồ sơ</div>
                <div className="text-[10px] text-blue-200">Tự động phát hiện thiếu sót và đề xuất phòng</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/ai-review')}
              className="px-2.5 py-1 bg-[#005FAF] hover:bg-[#004A8A] rounded-lg text-xs font-semibold cursor-pointer shrink-0 ml-2"
            >
              Mở ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
