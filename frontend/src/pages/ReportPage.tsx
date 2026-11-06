import React, { useState, useMemo } from 'react';
import { Sparkles, Send, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { SearchableCombobox, ComboboxOption } from '../components/common/SearchableCombobox';

export const ReportPage: React.FC = () => {
  const { events, saveReport, transitionEvent } = useEvents();
  const { currentUser } = useAuth();

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const [actualAttendees, setActualAttendees] = useState(selectedEvent?.expectedAttendees || 150);
  const [summary, setSummary] = useState(selectedEvent?.report?.summary || '');
  const [achievements, setAchievements] = useState(selectedEvent?.report?.achievements || '');
  const [challenges, setChallenges] = useState(selectedEvent?.report?.challenges || '');
  const [lessonsLearned, setLessonsLearned] = useState(selectedEvent?.report?.lessonsLearned || '');
  const [recommendations, setRecommendations] = useState(selectedEvent?.report?.recommendations || '');

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Chuyển đổi danh sách sự kiện thành options cho SearchableCombobox
  const eventOptions: ComboboxOption[] = useMemo(() => {
    return events.map((ev) => ({
      id: ev.id,
      code: ev.eventCode,
      label: ev.title,
      subLabel: `${ev.organizingUnit || ''} • Địa điểm: ${ev.preferredVenue || 'Chưa cập nhật'}`,
    }));
  }, [events]);

  // Xử lý khi thay đổi sự kiện đã chọn
  const handleEventChange = (id: string) => {
    setSelectedEventId(id);
    const ev = events.find((x) => x.id === id);
    if (ev) {
      setActualAttendees(ev.expectedAttendees || 150);
      setSummary(ev.report?.summary || '');
      setAchievements(ev.report?.achievements || '');
      setChallenges(ev.report?.challenges || '');
      setLessonsLearned(ev.report?.lessonsLearned || '');
      setRecommendations(ev.report?.recommendations || '');
    } else {
      setActualAttendees(150);
      setSummary('');
      setAchievements('');
      setChallenges('');
      setLessonsLearned('');
      setRecommendations('');
    }
  };

  // AI draft generator
  const handleGenerateAIDraft = () => {
    if (!selectedEvent) return;

    setSummary(
      `Chương trình "${selectedEvent.title}" do ${selectedEvent.organizingUnit} chủ trì tổ chức đã diễn ra thành công tốt đẹp tại ${selectedEvent.preferredVenue}. Sự kiện đã thu hút hơn ${actualAttendees} sinh viên và đại biểu tham dự.`
    );
    setAchievements(
      `1. Đạt 100% mục tiêu chuyên môn và phong trào đề ra trong kế hoạch.\n2. Ban tổ chức phối hợp hiệu quả với Bộ phận CSVC, đảm bảo an ninh trật tự và thiết bị vận hành an toàn.\n3. Nhận được đánh giá cao từ người tham dự thông qua biểu mẫu khảo sát trực tuyến.`
    );
    setChallenges(
      `1. Khâu đón tiếp lúc cao điểm đầu giờ còn hơi đông, cần bố trí thêm nhân sự check-in.\n2. Cần chuẩn bị thêm phương án micro dự phòng cho diễn giả.`
    );
    setLessonsLearned(
      `1. Cần họp rà soát kịch bản kỹ thuật âm thanh ánh sáng trước sự kiện 2 giờ.\n2. Đẩy mạnh truyền thông số đa kênh trên Fanpage trước ít nhất 7 ngày.`
    );
    setRecommendations(
      `1. Đề xuất Đoàn trường tiếp tục nhân rộng mô hình hoạt động này sang các kỳ tiếp theo.\n2. Đề nghị Nhà trường hỗ trợ nâng cấp thêm hệ thống âm thanh không dây tại hội trường.`
    );
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedEvent) {
      setErrorMessage('Vui lòng chọn một sự kiện trước khi nộp báo cáo.');
      return;
    }

    setSubmitting(true);
    try {
      const success = await saveReport(selectedEvent.id, {
        actualAttendees,
        summary,
        achievements,
        challenges,
        lessonsLearned,
        recommendations,
        status: 'SUBMITTED',
      });

      if (!success) {
        setErrorMessage('Không thể lưu dữ liệu báo cáo. Vui lòng thử lại.');
        return;
      }

      await transitionEvent(
        selectedEvent.id,
        'SUBMIT_REPORT',
        'REPORT_PENDING',
        'Đã hoàn thiện báo cáo và số liệu thực tế'
      );

      setSuccessMessage(`Đã nộp báo cáo tổng kết sự kiện "${selectedEvent.title}" thành công cho Đoàn Trường!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi nộp báo cáo tổng kết.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Báo cáo Tổng kết Sự kiện
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tổng hợp số liệu thực tế, đánh giá kết quả, rút kinh nghiệm và trình Đoàn trường phê duyệt đóng hồ sơ
        </p>
      </div>

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmitReport} className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-2xs space-y-5">
        
        {/* ── BỐ CỤC HÀNG CHỌN SỰ KIỆN: [Nhãn] [Combobox dài] [Nút AI] ── */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 border-b border-slate-200 pb-4">
          {/* Nhãn */}
          <label className="text-xs font-semibold text-slate-700 whitespace-nowrap shrink-0 lg:w-48">
            Chọn sự kiện lập báo cáo:
          </label>

          {/* Ô Searchable Combobox chiếm phần lớn không gian */}
          <div className="flex-1 min-w-0">
            <SearchableCombobox
              options={eventOptions}
              value={selectedEventId}
              onChange={handleEventChange}
              placeholder="Tìm kiếm sự kiện theo tên hoặc mã hồ sơ..."
              emptyMessage="Không tìm thấy sự kiện phù hợp"
            />
          </div>

          {/* Nút AI Tạo bản nháp báo cáo */}
          <button
            type="button"
            onClick={handleGenerateAIDraft}
            disabled={!selectedEvent}
            className="min-h-[42px] px-4 bg-gradient-to-r from-[#005FAF] to-[#003D70] hover:from-[#1A78CD] hover:to-[#004A8A] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
            title="Sử dụng AI tự động tạo dàn ý báo cáo mẫu từ dữ liệu sự kiện"
          >
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span>AI Tạo bản nháp báo cáo</span>
          </button>
        </div>

        {/* Thông tin nhanh về sự kiện đã chọn */}
        {selectedEvent && (
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs flex items-center justify-between flex-wrap gap-2 text-slate-700">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#005FAF] shrink-0" />
              <span>
                Đơn vị tổ chức: <strong>{selectedEvent.organizingUnit}</strong> | Địa điểm: <strong>{selectedEvent.preferredVenue}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Dự kiến ban đầu: <strong>{selectedEvent.expectedAttendees}</strong> người
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Số lượng người tham dự thực tế:
          </label>
          <input
            type="number"
            min={1}
            value={actualAttendees}
            onChange={(e) => setActualAttendees(Number(e.target.value))}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:border-[#005FAF] focus:bg-white"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            1. Tóm tắt diễn biến chương trình:
          </label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#005FAF] focus:bg-white"
            placeholder="Mô tả khái quát quá trình diễn ra sự kiện, các mốc thời gian chính..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            2. Kết quả và Thành tựu đạt được:
          </label>
          <textarea
            rows={3}
            value={achievements}
            onChange={(e) => setAchievements(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#005FAF] focus:bg-white"
            placeholder="Những mục tiêu đã hoàn thành, số lượng người tham gia, phản hồi từ sinh viên..."
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              3. Khó khăn và Tồn tại:
            </label>
            <textarea
              rows={3}
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#005FAF] focus:bg-white"
              placeholder="Những hạn chế phát sinh trong khâu tổ chức, CSVC hoặc thời tiết..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              4. Bài học kinh nghiệm:
            </label>
            <textarea
              rows={3}
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#005FAF] focus:bg-white"
              placeholder="Kinh nghiệm phối hợp, kiểm soát thời gian và truyền thông..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            5. Đề xuất và Kiến nghị với Nhà trường:
          </label>
          <textarea
            rows={2}
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:outline-none focus:border-[#005FAF] focus:bg-white"
            placeholder="Các kiến nghị về cơ sở vật chất, thủ tục hoặc kinh phí cho các chương trình sau..."
          />
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-200">
          <button
            type="submit"
            disabled={submitting || !selectedEvent}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#005FAF] hover:bg-[#004A8A] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs min-h-[42px] transition-all disabled:opacity-50"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Nộp báo cáo cho Đoàn Trường</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
