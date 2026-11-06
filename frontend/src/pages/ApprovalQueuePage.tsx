import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Eye,
  Calendar,
  Building,
  User,
  Clock,
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { roleNames, formatDate, statusLabels, formatCurrency } from '../utils/helpers';
import { filterApprovalQueueEvents } from './approvalQueueFilter';

export const ApprovalQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const { events, transitionEvent, saving } = useEvents();
  const { currentUser } = useAuth();

  const queueEvents = filterApprovalQueueEvents(events, currentUser.role);

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Header with DUE Role Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#005FAF] border border-blue-200">
              {roleNames[currentUser.role]}
            </span>
            <span className="text-[11px] text-slate-400">Không gian làm việc chuyên trách</span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Hàng đợi xét duyệt và Thẩm định nghiệp vụ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Các hồ sơ đang chờ đơn vị bạn thẩm định, phê duyệt hoặc ra quyết định
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#005FAF]" />
            <span>Đang chờ xử lý: <strong className="text-[#005FAF] font-bold ml-1">{queueEvents.length}</strong> hồ sơ</span>
          </div>
        </div>
      </div>

      {/* Queue Cards / Table */}
      {queueEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-10 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#009444] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">Không có hồ sơ nào đang chờ duyệt</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Tất cả các hồ sơ gửi đến vai trò {roleNames[currentUser.role]} đã được xử lý xong hoặc chưa phát sinh yêu cầu mới.
          </p>
          <button
            onClick={() => navigate('/events')}
            className="mt-1 px-3.5 py-1.5 bg-[#005FAF] hover:bg-[#004A8A] text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs transition-all"
          >
            Xem danh sách tất cả hồ sơ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-3.5">
          {queueEvents.map((ev) => {
            const statusInfo = statusLabels[ev.status];
            const totalBudget = (ev.budgetItems || []).reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);

            return (
              <div
                key={ev.id}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#005FAF] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {ev.eventCode}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusInfo?.bg} ${statusInfo?.color} ${statusInfo?.border}`}
                    >
                      {statusInfo?.label}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">• {ev.organizingUnit}</span>
                  </div>

                  <h3
                    onClick={() => navigate(`/events/${ev.id}`)}
                    className="text-sm sm:text-base font-bold text-slate-900 hover:text-[#005FAF] transition-colors cursor-pointer truncate"
                  >
                    {ev.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ev.objectives || ev.description || 'Hồ sơ đề xuất tổ chức sự kiện dành cho sinh viên trường.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(ev.startDate)}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]">{ev.preferredVenue}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[140px]">{ev.contactPerson}</span>
                    </span>
                    {totalBudget > 0 && (
                      <span className="font-semibold text-slate-700">
                        Dự toán: <strong className="text-[#005FAF]">{formatCurrency(totalBudget)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Action buttons */}
                <div className="flex flex-wrap md:flex-col items-stretch md:items-end gap-1.5 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-2.5 md:pt-0 md:pl-4">
                  <button
                    onClick={() => navigate(`/events/${ev.id}`)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs transition-all min-h-[34px]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Thẩm định ngay</span>
                  </button>

                  {currentUser.role === 'BCN_KHOA' && ev.status === 'FACULTY_REVIEW' && (
                    <button
                      disabled={saving}
                      onClick={() =>
                        transitionEvent(ev.id, 'APPROVE', 'FACULTY_APPROVED', 'Ban Chủ nhiệm Khoa chấp thuận hồ sơ')
                      }
                      className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#009444] hover:bg-[#007A38] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Duyệt nhanh</span>
                    </button>
                  )}

                  {currentUser.role === 'DOAN_TRUONG' &&
                    (ev.status === 'FACULTY_APPROVED' || ev.status === 'UNIVERSITY_REVIEW') && (
                      <button
                        disabled={saving}
                        onClick={() =>
                          transitionEvent(
                            ev.id,
                            'APPROVE',
                            'PERMIT_ISSUED',
                            'Đoàn Trường cấp phép tổ chức chính thức'
                          )
                        }
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#009444] hover:bg-[#007A38] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-all disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cấp phép nhanh</span>
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
