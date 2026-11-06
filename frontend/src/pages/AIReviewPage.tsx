import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  XCircle,
  Info,
  Calendar,
  MapPin,
  Users,
  Building,
  ExternalLink,
  Edit,
  FileText,
  BadgeAlert,
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { api } from '../services/api';
import { formatDate, statusLabels } from '../utils/helpers';

interface AIReviewResult {
  isAI: boolean;
  aiProvider?: string;
  score: number;
  summary: string;
  missingFields: string[];
  inconsistencies: string[];
  risks: string[];
  suggestions: string[];
  details: {
    category: string;
    level: 'INFO' | 'WARNING' | 'ERROR';
    message: string;
  }[];
}

export const AIReviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { events } = useEvents();

  const urlEventId = searchParams.get('eventId');
  const [selectedEventId, setSelectedEventId] = useState<string>(urlEventId || events[0]?.id || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync state if url query changes
  useEffect(() => {
    const qEventId = searchParams.get('eventId');
    if (qEventId && qEventId !== selectedEventId) {
      setSelectedEventId(qEventId);
    }
  }, [searchParams]);

  // Sync default selection once events load
  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      const targetId = urlEventId || events[0].id;
      setSelectedEventId(targetId);
    }
  }, [events, selectedEventId, urlEventId]);

  const runAnalysis = useCallback(async (eventId: string) => {
    if (!eventId) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await api.aiReview(eventId);
      setResult(res.data as AIReviewResult);
    } catch (err: any) {
      setError(err.message || 'Không thể kết nối đến máy chủ phân tích. Vui lòng thử lại.');
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Run analysis whenever selectedEventId changes
  useEffect(() => {
    if (selectedEventId) {
      runAnalysis(selectedEventId);
    }
  }, [selectedEventId, runAnalysis]);

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const handleSelectEvent = (id: string) => {
    setSelectedEventId(id);
    setSearchParams({ eventId: id });
  };

  const score = result?.score ?? 0;

  const levelIcon = (level: 'INFO' | 'WARNING' | 'ERROR') => {
    if (level === 'ERROR') return <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />;
    if (level === 'WARNING') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />;
    return <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />;
  };

  const levelBg = (level: 'INFO' | 'WARNING' | 'ERROR') => {
    if (level === 'ERROR') return 'bg-rose-50 border-rose-200 text-rose-900';
    if (level === 'WARNING') return 'bg-amber-50 border-amber-200 text-amber-900';
    return 'bg-blue-50 border-blue-200 text-blue-900';
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#003D70] via-[#005FAF] to-[#004A8A] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white border border-white/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Trợ lý AI Rà soát
            </span>
            <span className="text-xs text-blue-100 font-medium">Hệ thống thẩm định tự động theo Quy chế số 184/QĐ-ĐHKT</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Rà soát Hồ sơ và Cảnh báo Xung đột Quy chế</h1>
          <p className="text-blue-100 text-xs md:text-sm mt-1 max-w-xl">
            Tự động kiểm tra tính đầy đủ, phát hiện trùng lịch cơ sở vật chất, thẩm định định mức tài chính và đề xuất cải thiện trước khi trình cấp duyệt.
          </p>
        </div>

        <button
          onClick={() => runAnalysis(selectedEventId)}
          disabled={isAnalyzing || !selectedEventId}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'Đang phân tích...' : 'Chạy lại rà soát'}</span>
        </button>
      </div>

      {/* Select Event và Info Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" /> Chọn hồ sơ sự kiện cần thẩm định:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => handleSelectEvent(e.target.value)}
            className="text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-md w-full"
          >
            {events.length === 0 && <option value="">-- Chưa có hồ sơ nào --</option>}
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                [{ev.eventCode}] {ev.title} ({ev.organizingUnit})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Event Quick Info */}
        {selectedEvent && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{selectedEvent.organizingUnit}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{formatDate(selectedEvent.startDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{selectedEvent.preferredVenue || 'Chưa chọn hội trường'}</span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2">
              {(() => {
                const st = (statusLabels as any)[selectedEvent.status];
                return (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${st ? `${st.bg} ${st.color} ${st.border}` : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    {st?.label || selectedEvent.status}
                  </span>
                );
              })()}
              <button
                onClick={() => navigate(`/events/${selectedEvent.id}`)}
                className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                title="Xem hồ sơ chi tiết"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-sm text-rose-800">
          <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Không thể phân tích hồ sơ</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isAnalyzing && !result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 h-72" />
          <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 h-72" />
        </div>
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score và Summary */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Điểm chuẩn bị hồ sơ</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold lowercase">
                  thang 100
                </span>
              </div>

              <div className="flex items-baseline gap-2 mt-3">
                <span className={`text-5xl font-black ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-rose-600'}`}>
                  {score}
                </span>
                <span className="text-slate-400 font-bold">/ 100</span>
              </div>

              <div className="mt-3">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-slate-700 mt-4 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {result.summary}
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-blue-900 flex items-center justify-between">
                <div>
                  <span className="font-bold">Động cơ phân tích:</span>
                  <div className="text-[10px] text-blue-700 mt-0.5">{result.aiProvider || 'Quy chế 184/QĐ-ĐHKT'}</div>
                </div>
                {result.isAI && (
                  <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[9px]">
                    AI ACTIVE
                  </span>
                )}
              </div>

              {selectedEvent && (
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/events/${selectedEvent.id}`)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Xem hồ sơ
                  </button>
                  <button
                    onClick={() => navigate(`/events/${selectedEvent.id}/edit`)}
                    className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Findings */}
          <div className="lg:col-span-2 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b pb-2 flex items-center justify-between">
              <span>Phân tích tính hợp lệ và Điểm rủi ro</span>
              <span className="text-xs font-normal text-slate-400">Đối chiếu Quy chế số 184/QĐ-ĐHKT</span>
            </h3>

            {/* Inconsistencies và Conflict Risks */}
            <div>
              <div className="text-xs font-bold text-rose-700 flex items-center gap-1.5 mb-2">
                <ShieldAlert className="w-4 h-4" /> Các rủi ro và Mâu thuẫn phát hiện ({(result.risks?.length || 0) + (result.inconsistencies?.length || 0)})
              </div>
              {(result.risks?.length || 0) + (result.inconsistencies?.length || 0) === 0 ? (
                <div className="text-xs p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Không phát hiện mâu thuẫn hoặc rủi ro nghiêm trọng về an toàn và hội trường</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {result.inconsistencies?.map((item, i) => (
                    <div key={`inc-${i}`} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                  {result.risks?.map((risk, i) => (
                    <div key={`risk-${i}`} className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Missing Info */}
            <div>
              <div className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4" /> Thông tin còn thiếu ({result.missingFields?.length || 0})
              </div>
              {(result.missingFields?.length || 0) === 0 ? (
                <div className="text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Các trường thông tin bắt buộc đã được điền đầy đủ</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {result.missingFields?.map((item, i) => (
                    <div key={i} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Recommendations */}
            <div>
              <div className="text-xs font-bold text-[#005FAF] flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-[#F37021]" /> Đề xuất cải tiến ({result.suggestions?.length || 0})
              </div>
              {(result.suggestions?.length || 0) === 0 ? (
                <div className="text-xs p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hồ sơ đã đạt tiêu chuẩn, không có đề xuất bổ sung</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {result.suggestions?.map((sug, i) => (
                    <div key={i} className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#005FAF] shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Check Log */}
      {result && result.details && result.details.length > 0 && !isAnalyzing && (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h3 className="text-sm font-bold text-slate-900">Nhật ký kiểm tra chi tiết theo từng danh mục</h3>
            <span className="text-xs text-slate-400 font-medium">{result.details.length} mục kiểm tra</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {result.details.map((d, i) => (
              <div key={i} className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${levelBg(d.level)}`}>
                {levelIcon(d.level)}
                <div className="leading-relaxed">
                  <span className="font-bold mr-1">[{d.category}]</span>
                  <span>{d.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
