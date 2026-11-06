import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Building,
  Users,
  Clock,
  DollarSign,
  FileText,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCheck,
  Send,
  Edit,
  ArrowLeft,
  Sparkles,
  Paperclip,
  Check,
  Receipt,
  Download,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { WorkflowStepper } from '../components/common/WorkflowStepper';
import { formatCurrency, formatDateTime, formatDate, roleNames, statusLabels } from '../utils/helpers';
import { api } from '../services/api';
import { EventStatus, WorkflowHistoryItem } from '../types';
import { canEditEvent, latestRevisionRequest } from './eventEditPolicy';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getEventById, transitionEvent, confirmBooking, rejectBooking, deleteEvent, saving, refresh, showToast } = useEvents();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'schedule' | 'budget' | 'facilities' | 'attachments' | 'history' | 'handover' | 'settlement' | 'report'
  >('overview');

  // Modal State for Workflow Decisions
  const [modalAction, setModalAction] = useState<{
    isOpen: boolean;
    title: string;
    actionName: string;
    targetStatus: EventStatus;
    requireComment: boolean;
  }>({
    isOpen: false,
    title: '',
    actionName: '',
    targetStatus: 'DRAFT',
    requireComment: false,
  });

  const [decisionComment, setDecisionComment] = useState('');
  const [commentError, setCommentError] = useState('');

  const event = getEventById(id || '');

  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableActionsError, setAvailableActionsError] = useState('');
  const [historyEntries, setHistoryEntries] = useState<WorkflowHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  useEffect(() => {
    let active = true;
    setAvailableActions([]);
    setAvailableActionsError('');
    if (event) api.getAvailableActions(event.id)
      .then(result => { if (active) setAvailableActions(result.data); })
      .catch(error => {
        if (active) setAvailableActionsError(error instanceof Error ? error.message : 'Không tải được thao tác quy trình');
      });
    return () => { active = false; };
  }, [event?.id, event?.status, currentUser.id]);
  useEffect(() => {
    if (!event || activeTab !== 'history') return;
    let active = true;
    setHistoryLoading(true);
    setHistoryError('');
    api.getEventHistory(event.id)
      .then((result) => {
        if (active) {
          setHistoryEntries(result.data.map((item: any) => ({
            ...item,
            timestamp: item.timestamp || item.createdAt,
          })));
        }
      })
      .catch((error) => {
        if (active) {
          setHistoryEntries(event.history || []);
          setHistoryError(error instanceof Error ? error.message : 'Không tải được lịch sử duyệt');
        }
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => { active = false; };
  }, [activeTab, event?.id]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalAction.isOpen) {
        setModalAction((prev) => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAction.isOpen]);

  const getActionStyle = (action: string) => {
    if (['APPROVE', 'CONFIRM', 'ACCEPT', 'READY', 'HANDOVER', 'SETTLE', 'COMPLETE'].includes(action)) {
      return 'bg-[#009444] hover:bg-[#007A38] text-white shadow-xs';
    }
    if (['REQUEST_REVISION', 'ADJUST', 'SUBMIT_DOCUMENTS', 'PROCEED_BUDGET'].includes(action)) {
      return 'bg-[#FE751E] hover:bg-[#D45B0E] text-white shadow-xs';
    }
    if (['REJECT', 'CONFLICT', 'INCIDENT', 'REJECT_PAYMENT', 'CANCEL'].includes(action)) {
      return 'bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs';
    }
    return 'bg-[#005FAF] hover:bg-[#004A8A] text-white shadow-xs';
  };

  const actionLabels: Record<string, string> = {
    SUBMIT: 'Nộp hồ sơ', RESUBMIT: 'Nộp lại hồ sơ', APPROVE: 'Phê duyệt', REJECT: 'Từ chối', REQUEST_REVISION: 'Yêu cầu chỉnh sửa', CANCEL: 'Hủy hồ sơ',
    PROCEED_BUDGET: 'Chuyển duyệt dự toán', CONFIRM: 'Xác nhận giữ chỗ', CONFLICT: 'Báo trùng lịch', ADJUST: 'Gửi lại yêu cầu CSVC', READY: 'Xác nhận sẵn sàng', HANDOVER: 'Xác nhận bàn giao',
    START_EVENT: 'Bắt đầu sự kiện', END_EVENT: 'Xác nhận đã tổ chức sự kiện xong', CONFIRM_FACILITY: 'Chuyển mượn cơ sở vật chất', INSPECT: 'Kiểm tra hoàn trả', ACCEPT: 'Nghiệm thu', INCIDENT: 'Báo sự cố', RESOLVE: 'Đã xử lý sự cố',
    SUBMIT_REPORT: 'Nộp báo cáo', SUBMIT_DOCUMENTS: 'Nộp chứng từ', SETTLE: 'Xác nhận hoàn tất quyết toán', REJECT_PAYMENT: 'Từ chối thanh toán', COMPLETE: 'Hoàn tất hồ sơ',
  };

  if (!event) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Không tìm thấy hồ sơ sự kiện</h2>
        <p className="text-xs text-slate-500 mt-1">Hồ sơ có thể đã bị xóa hoặc đường dẫn không đúng.</p>
        <button
          onClick={() => navigate('/events')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  // Handle Workflow Decision Execution
  const handleConfirmDecision = async () => {
    if (modalAction.requireComment && !decisionComment.trim()) {
      setCommentError('Vui lòng nhập lý do / ý kiến phản hồi cụ thể');
      return;
    }
    const success = await transitionEvent(
      event.id,
      modalAction.actionName,
      modalAction.targetStatus,
      decisionComment.trim(),
      decisionComment.trim()
    );
    if (!success) return;
    setModalAction({ ...modalAction, isOpen: false });
    setDecisionComment('');
    setCommentError('');
  };

  const totalBudget = (event.budgetItems || []).reduce((s, i) => s + (Number(i.totalPrice) || 0), 0);
  const canEdit = canEditEvent(event.status, event.createdById, currentUser.id, currentUser.role);
  const revisionRequest = latestRevisionRequest(event.history || []);

  return (
    <div className="space-y-4 sm:space-y-5 max-w-7xl mx-auto">
      {/* Top Navigation và Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách hồ sơ
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/ai-review?eventId=${event.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 text-[#D45F1A] hover:bg-orange-100 border border-orange-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rà soát AI</span>
          </button>
          {canEdit && (
            <button
              onClick={() => navigate(`/events/${event.id}/edit`)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 border border-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>{event.status === 'DRAFT' ? 'Tiếp tục chỉnh sửa' : 'Chỉnh sửa hồ sơ'}</span>
            </button>
          )}
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Xóa hồ sơ</span>
            </button>
          )}
        </div>
      </div>

      {event.status.endsWith('_REVISION_REQUESTED') && (
        <section className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950" aria-label="Yêu cầu chỉnh sửa hồ sơ">
          <h2 className="font-bold">Yêu cầu chỉnh sửa hồ sơ</h2>
          {revisionRequest ? (
            <>
              <p className="mt-1">Người yêu cầu: {revisionRequest.actorName} ({roleNames[revisionRequest.actorRole] || revisionRequest.actorRole})</p>
              <p>Cấp duyệt: {statusLabels[revisionRequest.fromStatus as EventStatus]?.label || revisionRequest.fromStatus}</p>
              <p>Thời gian: {formatDateTime(revisionRequest.timestamp)}</p>
              <p className="mt-2 whitespace-pre-wrap">{revisionRequest.comments || 'Không có nhận xét chi tiết.'}</p>
            </>
          ) : <p className="mt-1">Chưa có nội dung nhận xét được lưu trong lịch sử.</p>}
          {canEdit && (
            <button onClick={() => navigate(`/events/${event.id}/edit`)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-700 px-3 py-2 font-bold text-white hover:bg-amber-800">
              <Edit className="h-3.5 w-3.5" /> Chỉnh sửa hồ sơ
            </button>
          )}
        </section>
      )}

      {/* Main Event Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {event.eventCode}
              </span>
              <span className="text-xs text-slate-400">Phiên bản v{event.currentVersion}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">{event.organizingUnit}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{event.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availableActionsError && (
              <span role="alert" className="text-xs text-rose-600">{availableActionsError}</span>
            )}
            {availableActions.map((action) => (
              <button
                key={action}
                disabled={saving}
                onClick={() =>
                  setModalAction({
                    isOpen: true,
                    title: actionLabels[action] || action,
                    actionName: action,
                    targetStatus: 'DRAFT',
                    requireComment: ['REJECT', 'REQUEST_REVISION', 'CONFLICT', 'INCIDENT', 'REJECT_PAYMENT'].includes(action),
                  })
                }
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5 ${getActionStyle(action)}`}
              >
                {actionLabels[action] || action}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Meta Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-3.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-[10px] text-slate-400">Thời gian tổ chức</div>
              <div className="font-semibold text-slate-800">{formatDate(event.startDate)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#F37021]" />
            <div>
              <div className="text-[10px] text-slate-400">Địa điểm dự kiến</div>
              <div className="font-semibold text-slate-800 truncate max-w-[180px]">{event.preferredVenue}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] text-slate-400">Quy mô người tham dự</div>
              <div className="font-semibold text-slate-800">{event.expectedAttendees} sinh viên / đại biểu</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-[10px] text-slate-400">Tổng dự toán ngân sách</div>
              <div className="font-semibold text-slate-800">{formatCurrency(totalBudget)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Stepper Visualizer */}
      <WorkflowStepper status={event.status} />

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="border-b border-slate-200 flex overflow-x-auto scrollbar-none px-3 pt-1.5 gap-0.5">
          {[
            { id: 'overview', label: '1. Thông tin chung', icon: FileText },
            { id: 'schedule', label: '2. Kịch bản chương trình', icon: Clock },
            { id: 'budget', label: '3. Dự trù kinh phí', icon: DollarSign },
            { id: 'facilities', label: '4. Đăng ký CSVC', icon: Building },
            { id: 'attachments', label: '5. Hồ sơ đính kèm', icon: Paperclip },
            { id: 'history', label: '6. Lịch sử duyệt', icon: History },
            { id: 'handover', label: '7. Bàn giao và Nghiệm thu', icon: CheckCircle2 },
            { id: 'settlement', label: '8. Quyết toán KHTC', icon: Receipt },
            { id: 'report', label: '9. Báo cáo tổng kết', icon: FileCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-2 border-b-2 font-medium text-xs whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/40'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Mục tiêu sự kiện</h3>
                  <p className="text-sm text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {event.objectives || 'Chưa cập nhật mục tiêu cụ thể'}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Nội dung chi tiết</h3>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {event.description || 'Chưa cập nhật mô tả nội dung'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Thông tin ban tổ chức</h3>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Đơn vị tổ chức:</span>
                      <span className="font-semibold text-slate-800">{event.organizingUnit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Người phụ trách:</span>
                      <span className="font-semibold text-slate-800">{event.contactPerson}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email liên hệ:</span>
                      <span className="font-medium text-blue-600">{event.contactEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Số điện thoại:</span>
                      <span className="font-medium text-slate-800">{event.contactPhone}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Khung thời gian</h3>
                  <div className="text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bắt đầu:</span>
                      <span className="font-semibold text-slate-800">{formatDateTime(event.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kết thúc:</span>
                      <span className="font-semibold text-slate-800">{formatDateTime(event.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Đối tượng tham gia:</span>
                      <span className="font-semibold text-slate-800">{event.targetAudience}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Agenda / Schedule */}
        {activeTab === 'schedule' && (
          <div className="p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Kịch bản chương trình theo khung giờ</h3>
            {(event.scheduleItems || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa nhập kịch bản chi tiết</div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-4 w-36">Khung giờ</th>
                      <th className="py-2.5 px-4">Nội dung hoạt động</th>
                      <th className="py-2.5 px-4 w-48">Người phụ trách</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(event.scheduleItems || []).map((s, idx) => (
                      <tr key={s.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-blue-600">{s.timeSlot}</td>
                        <td className="py-2.5 px-4 text-slate-800 font-medium">{s.activity}</td>
                        <td className="py-2.5 px-4 text-slate-600">{s.responsible}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Budget */}
        {activeTab === 'budget' && (
          <div className="p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Dự trù kinh phí chi tiết</h3>
              <div className="text-xs font-semibold text-slate-700">
                Tổng dự toán: <span className="text-base text-blue-600 font-bold ml-1">{formatCurrency(totalBudget)}</span>
              </div>
            </div>

            {(event.budgetItems || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có dự trù kinh phí</div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Danh mục</th>
                      <th className="py-2.5 px-4">Khoản mục chi</th>
                      <th className="py-2.5 px-4 text-center">Số lượng</th>
                      <th className="py-2.5 px-4 text-right">Đơn giá</th>
                      <th className="py-2.5 px-4 text-right">Thành tiền (Dự toán)</th>
                      <th className="py-2.5 px-4 text-right">Thực tế (nếu có)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(event.budgetItems || []).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-medium text-slate-600">{b.category}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{b.itemName}</td>
                        <td className="py-2.5 px-4 text-center font-mono">{b.quantity}</td>
                        <td className="py-2.5 px-4 text-right font-mono">{formatCurrency(b.unitPrice)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatCurrency(b.totalPrice)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-600">
                          {b.actualTotal ? formatCurrency(b.actualTotal) : '--'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Facilities và Equipment */}
        {activeTab === 'facilities' && (
          <div className="p-4 sm:p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-800">Cơ sở vật chất và Thiết bị đã đăng ký</h3>

            {event.booking ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold uppercase">Địa điểm sử dụng</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{event.booking.facilityName}</div>
                    <div className="text-xs text-slate-500 mt-1">
                      Thời gian mượn: {formatDateTime(event.booking.startTime)} — {formatDateTime(event.booking.endTime)}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        event.booking.status === 'CONFIRMED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : event.booking.status === 'CONFLICT'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {event.booking.status === 'CONFIRMED'
                        ? 'CSVC đã xác nhận giữ chỗ'
                        : event.booking.status === 'CONFLICT'
                        ? 'Xung đột lịch mượn'
                        : 'Chờ CSVC xác nhận'}
                    </span>
                  </div>
                </div>

                {event.booking.conflictDetails && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Cảnh báo trùng lịch từ hệ thống CSVC:</div>
                      <div>{event.booking.conflictDetails}</div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Danh sách thiết bị mượn kèm</h4>
                  {event.booking.equipmentItems.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">Không mượn thiết bị di động</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(event.booking?.equipmentItems || []).map((eq) => (
                        <div
                          key={eq.equipmentId}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <span className="font-semibold text-slate-800">{eq.equipmentName}</span>
                          <span className="font-bold font-mono px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                            x{eq.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">Chưa đăng ký mượn cơ sở vật chất</div>
            )}
          </div>
        )}

        {/* Tab 5: Attachments */}
        {activeTab === 'attachments' && (
          <div className="space-y-3.5 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Tài liệu và Hồ sơ đính kèm</h3>
                <p className="text-xs text-slate-500 mt-0.5">Các văn bản, dự toán, kế hoạch chi tiết hoặc hồ sơ liên quan</p>
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setIsUploading(true);
                      await api.uploadAttachment(event.id, file, 'OTHER');
                      showToast('Tải lên tài liệu thành công', 'success');
                      await refresh();
                    } catch (err: any) {
                      showToast(err.message || 'Lỗi khi tải tệp', 'error');
                    } finally {
                      setIsUploading(false);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }
                  }}
                />
                <button
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Đang tải lên...' : 'Tải lên tài liệu'}</span>
                </button>
              </div>
            </div>

            {(!event.attachments || event.attachments.length === 0) ? (
              <div className="py-12 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có tài liệu hoặc hồ sơ đính kèm nào được tải lên.
              </div>
            ) : (
              <div className="space-y-2">
                {event.attachments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-3.5 text-xs transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="break-all font-semibold text-slate-800">{doc.name}</div>
                        <div className="break-words text-[10px] text-slate-400">
                          {doc.type} • {doc.size} {doc.date ? `• Tải lên ngày ${doc.date}` : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void api.downloadAttachment(event.id, doc.id, doc.name).catch(error =>
                          showToast(error instanceof Error ? error.message : 'Không tải được tài liệu.', 'error')
                        );
                      }}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Download className="w-3.5 h-3.5" /> Tải về
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Workflow History */}
        {activeTab === 'history' && (
          <div className="p-4 sm:p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Lịch sử phê duyệt và Chuyển trạng thái</h3>
            {historyError && <p role="alert" className="mb-3 text-xs text-rose-600">{historyError}</p>}
            {historyLoading && <p className="mb-3 text-xs text-slate-500">Đang tải lịch sử...</p>}
            <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {historyEntries.map((h) => (
                <div key={h.id} className="relative pl-8 text-xs">
                  <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-blue-600 ring-4 ring-white" />
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{h.action}</span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(h.timestamp)}</span>
                    </div>
                    <div className="text-slate-600">
                      Người thực hiện: <span className="font-semibold text-slate-800">{h.actorName}</span> ({h.actorRole})
                    </div>
                    {h.comments && (
                      <div className="mt-2 text-slate-700 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{h.comments}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {!historyLoading && historyEntries.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-500">Chưa có lịch sử xử lý cho hồ sơ này.</p>
            )}
          </div>
        )}

        {/* Tab 7: Handover và Return */}
        {activeTab === 'handover' && (
          <div className="p-4 sm:p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-800">Biên bản bàn giao và Nghiệm thu hoàn trả</h3>
            {event.handover && event.handover.length > 0 ? (
              <div className="space-y-3">
                {(event.handover || []).map((rec) => (
                  <div key={rec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {rec.type === 'PRE_EVENT' ? 'Biên bản bàn giao trước sự kiện' : 'Biên bản nghiệm thu hoàn trả'}
                      </span>
                      <span className="text-slate-400">{formatDateTime(rec.confirmedAt)}</span>
                    </div>
                    <div>Người bàn giao: {rec.handoverByName} → Người nhận: {rec.receivedByName}</div>
                    <div>Tình trạng hội trường: {rec.facilityCondition}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có biên bản bàn giao hoặc nghiệm thu được ghi nhận
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Settlement */}
        {activeTab === 'settlement' && (
          <div className="p-4 sm:p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-800">Hồ sơ quyết toán tài chính (Phòng KHTC)</h3>
            {event.settlement ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
                  <div>
                    <div className="text-slate-400">Dự toán đã duyệt</div>
                    <div className="text-base font-bold text-slate-800 mt-1">{formatCurrency(event.settlement.totalBudgeted)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Thực tế chi</div>
                    <div className="text-base font-bold text-blue-600 mt-1">{formatCurrency(event.settlement.totalActual)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Chênh lệch</div>
                    <div className="text-base font-bold text-emerald-600 mt-1">{formatCurrency(event.settlement.difference)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-[11px] font-semibold text-slate-500">Ngày quyết toán</div>
                    <div className="mt-1 text-slate-800">
                      {event.settlement.settlementDate ? formatDate(event.settlement.settlementDate) : 'Chưa nhập'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <div className="text-[11px] font-semibold text-slate-500">Ghi chú quyết toán</div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-slate-800">{event.settlement.notes || 'Không có ghi chú'}</div>
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 uppercase text-xs pt-2">Chứng từ và Hóa đơn kèm theo</h4>
                <div className="space-y-2">
                  {(event.settlement?.documents || []).map((doc) => (
                    <div key={doc.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="break-words font-bold text-slate-800">
                          {doc.documentNumber || doc.fileName || doc.documentType} — {doc.description || 'Chứng từ tài chính'}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">Số tiền: {formatCurrency(doc.amount || 0)}</div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                          {doc.isVerified ? 'Đã kiểm tra hợp lệ' : 'Chờ kiểm tra'}
                        </span>
                        {doc.filePath && event.settlement.id && (
                          <button
                            type="button"
                            onClick={() => {
                              void api.downloadFinancialDocument(event.settlement!.id, doc.id, doc.fileName || doc.documentNumber || 'chung-tu').catch(error =>
                                showToast(error instanceof Error ? error.message : 'Không tải được chứng từ.', 'error')
                              );
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Download className="h-3.5 w-3.5" /> Tải về
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">Chưa tạo hồ sơ quyết toán tài chính</div>
            )}
          </div>
        )}

        {/* Tab 9: Final Report */}
        {activeTab === 'report' && (
          <div className="p-4 sm:p-5 space-y-3.5">
            <h3 className="text-sm font-bold text-slate-800">Báo cáo tổng kết sau sự kiện</h3>
            {event.report ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-900">Số lượng người tham gia thực tế: {event.report.actualAttendees} sinh viên</div>
                  <div>{event.report.summary}</div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Kết quả và thành tựu đạt được:</h4>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line">
                    {event.report.achievements}
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-1">Bài học kinh nghiệm:</h4>
                  <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line">
                    {event.report.lessonsLearned}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa nộp báo cáo tổng kết sự kiện
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sticky Action Bar according to Fitts's Law */}
      {availableActions.length > 0 && (
        <div className="sticky bottom-4 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl py-3 px-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#005FAF] animate-pulse shrink-0" />
            <span className="text-xs font-bold text-slate-700">
              Thao tác nhanh cho {roleNames[currentUser.role]}:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {availableActions.map((action) => (
              <button
                key={action}
                disabled={saving}
                onClick={() =>
                  setModalAction({
                    isOpen: true,
                    title: actionLabels[action] || action,
                    actionName: action,
                    targetStatus: 'DRAFT',
                    requireComment: ['REJECT', 'REQUEST_REVISION', 'CONFLICT', 'INCIDENT', 'REJECT_PAYMENT'].includes(action),
                  })
                }
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all disabled:opacity-50 min-h-[38px] flex items-center gap-1.5 ${getActionStyle(action)}`}
              >
                {actionLabels[action] || action}
              </button>
            ))}
          </div>
        </div>
      )}

      {deleteModalOpen && currentUser.role === 'ADMIN' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-event-title" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
            <div>
              <h2 id="delete-event-title" className="text-base font-bold text-slate-900">Xóa hồ sơ sự kiện</h2>
              <p className="mt-1 text-xs text-slate-600">{event.eventCode} · {event.title}</p>
            </div>
            <label className="block text-xs font-semibold text-slate-700">
              Lý do xóa <span className="text-rose-600">*</span>
              <textarea
                autoFocus
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 p-2 text-sm font-normal focus:border-blue-500 focus:outline-none"
                placeholder="Nhập lý do để lưu vào nhật ký quản trị"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteModalOpen(false);
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
                  const deleted = await deleteEvent(event.id, deleteReason);
                  setDeleting(false);
                  if (deleted) {
                    setDeleteModalOpen(false);
                    navigate('/events');
                  }
                }}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? 'Đang xóa...' : 'Xóa mềm hồ sơ'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Decision Action Modal */}
      {modalAction.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg p-4 sm:p-5 space-y-3.5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">{modalAction.title}</h3>
              <button
                onClick={() => setModalAction({ ...modalAction, isOpen: false })}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-3">
                Bạn đang thao tác với tư cách: <span className="font-bold text-slate-800">{currentUser.fullName}</span> (
                {roleNames[currentUser.role]}).
              </p>

              {modalAction.requireComment ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Ý kiến phản hồi / Lý do <span className="text-rose-500">*</span>:
                  </label>
                  <textarea
                    rows={4}
                    value={decisionComment}
                    onChange={(e) => {
                      setDecisionComment(e.target.value);
                      if (e.target.value.trim()) setCommentError('');
                    }}
                    placeholder="Nhập lý do cụ thể để BTC chỉnh sửa hoặc nắm rõ..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  {commentError && <p className="text-[11px] text-rose-500 mt-1 font-medium">{commentError}</p>}
                </div>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed font-medium">
                  Xác nhận thực hiện hành động: <strong className="text-blue-700">{modalAction.title}</strong> cho hồ sơ sự kiện này?
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalAction({ ...modalAction, isOpen: false })}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-xs transition-all ${getActionStyle(modalAction.actionName)}`}
              >
                Xác nhận thực hiện
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
