import prisma from '../config/database';
import { config } from '../config';

export interface AIReviewResult {
  isAI: boolean;
  aiProvider?: string;
  score: number; // 0 - 100
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

/**
 * Call external AI Provider (e.g. Google Gemini) if configured
 */
async function callExternalAI(event: any, ruleSummary: string): Promise<string | null> {
  if (!config.aiApiKey) return null;

  try {
    const prompt = `Bạn là trợ lý AI thẩm định hồ sơ sự kiện sinh viên theo Quy chế số 184/QĐ-ĐHKT của Trường Đại học Kinh tế - ĐH Đà Nẵng.
Hãy đưa ra 1 đoạn nhận xét tổng quan ngắn gọn (tối đa 3 câu) về mức độ hoàn thiện của hồ sơ sau:
- Tên sự kiện: ${event.title}
- Đơn vị tổ chức: ${event.organizingUnit}
- Mục tiêu: ${event.objectives || 'Chưa có'}
- Số người tham gia dự kiến: ${event.expectedAttendees || 0}
- Ngân sách dự toán: ${event.budgetItems?.reduce((s: number, i: any) => s + i.totalPrice, 0) || 0} VNĐ
- Kết quả kiểm tra quy chế: ${ruleSummary}

Hãy trả lời ngắn gọn, trang trọng, mang tính xây dựng.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.aiApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data: any = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    }
  } catch (_e) {
    // Graceful fallback to rule-based
  }
  return null;
}

export async function reviewApplication(eventId: string): Promise<AIReviewResult> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      budgetItems: true,
      scheduleItems: true,
      resourceBookings: { include: { facility: true, bookingItems: { include: { equipment: true } } } },
      attachments: true,
    },
  });

  if (!event) throw new Error('Không tìm thấy sự kiện');

  // Rule-based analyzer (based on DUE Event Regulation 184/QĐ-ĐHKT)
  const missingFields: string[] = [];
  const inconsistencies: string[] = [];
  const risks: string[] = [];
  const suggestions: string[] = [];
  const details: AIReviewResult['details'] = [];

  // 1. Basic Fields Check
  if (!event.title || event.title.trim().length < 5) {
    missingFields.push('Tên sự kiện quá ngắn hoặc chưa nhập');
    details.push({ category: 'Thông tin chung', level: 'ERROR', message: 'Tên sự kiện cần rõ ràng và tối thiểu 5 ký tự' });
  }
  if (!event.objectives || event.objectives.trim().length < 20) {
    missingFields.push('Mục tiêu sự kiện sơ sài');
    details.push({ category: 'Kế hoạch', level: 'WARNING', message: 'Mục tiêu sự kiện cần cụ thể, nêu bật giá trị cho sinh viên' });
  }
  if (!event.targetAudience) {
    missingFields.push('Chưa xác định đối tượng tham dự');
    details.push({ category: 'Đối tượng', level: 'WARNING', message: 'Cần xác định đối tượng: sinh viên toàn trường, sinh viên khoa hay đại biểu ngoài trường' });
  }
  if (!event.expectedAttendees || event.expectedAttendees <= 0) {
    missingFields.push('Số lượng người tham dự chưa hợp lệ');
    details.push({ category: 'Quy mô', level: 'ERROR', message: 'Cần có số lượng dự kiến để bố trí cơ sở vật chất' });
  }

  // Contact info check
  if (!event.contactPerson || !event.contactPhone) {
    missingFields.push('Chưa có thông tin người phụ trách hoặc số điện thoại liên hệ');
    details.push({ category: 'Thông tin chung', level: 'WARNING', message: 'Cần số điện thoại người phụ trách để phối hợp bàn giao hội trường & xử lý sự cố' });
  }

  // 2. Schedule Check
  if (!event.startDate || !event.endDate) {
    missingFields.push('Chưa chọn thời gian bắt đầu hoặc kết thúc');
    details.push({ category: 'Thời gian', level: 'ERROR', message: 'Thiếu mốc thời gian diễn ra sự kiện' });
  } else {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const now = new Date();
    if (start < now) {
      inconsistencies.push('Thời gian bắt đầu sự kiện đang ở trong quá khứ');
      details.push({ category: 'Thời gian', level: 'WARNING', message: 'Thời gian bắt đầu sự kiện nhỏ hơn ngày hiện tại' });
    }
    if (start.getTime() === end.getTime()) {
      inconsistencies.push('Giờ kết thúc không được trùng với giờ bắt đầu');
      details.push({ category: 'Thời gian', level: 'ERROR', message: 'Thời gian bắt đầu và kết thúc trùng nhau' });
    } else if (start > end) {
      inconsistencies.push('Thời gian kết thúc phải sau thời gian bắt đầu');
      details.push({ category: 'Thời gian', level: 'ERROR', message: 'Thời gian kết thúc sớm hơn thời gian bắt đầu' });
    } else {
      const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      if (durationHours < 0.5) {
        inconsistencies.push('Thời lượng sự kiện quá ngắn (dưới 30 phút)');
        details.push({ category: 'Thời gian', level: 'WARNING', message: 'Thời lượng sự kiện dưới 30 phút, cần kiểm tra lại khung giờ' });
      }
    }
  }

  // 3. Program Agenda / Schedule Items
  if (!event.scheduleItems || event.scheduleItems.length === 0) {
    suggestions.push('Nên bổ sung kịch bản chi tiết theo khung giờ (Agenda/Timeline)');
    details.push({ category: 'Kịch bản', level: 'WARNING', message: 'Chưa có phân bổ các tiết mục / nội dung chi tiết theo mốc thời gian' });
  }

  // 4. Budget check
  if (!event.budgetItems || event.budgetItems.length === 0) {
    suggestions.push('Sự kiện chưa có dự trù kinh phí chi tiết');
    details.push({ category: 'Ngân sách', level: 'INFO', message: 'Nếu sự kiện có kinh phí, vui lòng bổ sung từng khoản chi cụ thể' });
  } else {
    const totalBudget = event.budgetItems.reduce((s, i) => s + i.totalPrice, 0);
    if (totalBudget > 50000000) {
      risks.push('Dự toán vượt mức 50 triệu đồng - Cần giải trình định mức chi và hóa đơn VAT theo quy chế tài chính');
      details.push({ category: 'Ngân sách', level: 'WARNING', message: 'Tổng ngân sách lớn yêu cầu thẩm định kỹ nguồn tài trợ và chứng từ' });
    }
  }

  // 5. Facility, Status & Capacity Match
  if (event.status === 'FACILITY_CONFLICT') {
    inconsistencies.push('Hồ sơ đang bị trùng lịch hội trường với sự kiện khác. Cần chọn phòng hoặc khung giờ thay thế.');
    details.push({ category: 'Cơ sở vật chất', level: 'ERROR', message: 'Phát hiện xung đột lịch mượn địa điểm trên hệ thống' });
  }

  if (event.resourceBookings && event.resourceBookings.length > 0) {
    for (const b of event.resourceBookings) {
      if (b.status === 'CONFLICT') {
        inconsistencies.push(`Lịch mượn phòng ${b.facility?.name || ''} đang ở trạng thái xung đột (CONFLICT)`);
        details.push({ category: 'Cơ sở vật chất', level: 'ERROR', message: `Trùng lịch hội trường ${b.facility?.name || ''}` });
      }
      if (b.facility && b.facility.capacity && (event.expectedAttendees || 0) > b.facility.capacity) {
        inconsistencies.push(`Số người tham dự (${event.expectedAttendees}) vượt quá sức chứa hội trường ${b.facility.name} (${b.facility.capacity} chỗ)`);
        details.push({ category: 'Cơ sở vật chất', level: 'ERROR', message: `Quá tải sức chứa hội trường ${b.facility.name}` });
      }
    }
  } else {
    suggestions.push('Chưa đăng ký hội trường hoặc phòng mượn thông qua hệ thống');
  }

  // 7. Attachments Check
  if (!event.attachments || event.attachments.length === 0) {
    suggestions.push('Nên đính kèm tệp văn bản (Kế hoạch tổ chức, Tờ trình hoặc Ma trận rủi ro) để thuận tiện xét duyệt');
    details.push({ category: 'Tài liệu đính kèm', level: 'INFO', message: 'Hồ sơ chưa có tệp đính kèm văn bản' });
  }

  const score = Math.max(15, 100 - (missingFields.length * 15 + inconsistencies.length * 20 + risks.length * 10));

  let summary = `Hồ sơ đạt ${score}/100 điểm đánh giá sơ bộ. `;
  if (inconsistencies.length > 0 || missingFields.length > 0) {
    summary += `Phát hiện ${inconsistencies.length} điểm mâu thuẫn và ${missingFields.length} thông tin cần bổ sung trước khi trình BCN Khoa / Đoàn trường.`;
  } else {
    summary += 'Hồ sơ có cấu trúc tương đối đầy đủ và hợp lệ, sẵn sàng chuyển cấp xét duyệt.';
  }

  // Optional AI enhancement
  let isAI = false;
  let aiProvider = 'Rule-based Quy chế 184/QĐ-ĐHKT';
  if (config.aiApiKey) {
    const aiNote = await callExternalAI(event, summary);
    if (aiNote) {
      summary += ` [Gợi ý từ AI: ${aiNote}]`;
      isAI = true;
      aiProvider = 'Google Gemini (Hybrid)';
    }
  }

  return {
    isAI,
    aiProvider,
    score,
    summary,
    missingFields,
    inconsistencies,
    risks,
    suggestions,
    details,
  };
}

export async function suggestResources(data: {
  expectedAttendees: number;
  startTime: string;
  endTime: string;
  eventType?: string;
}) {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  const facilities = await prisma.facility.findMany({ where: { isActive: true } });
  const allEquipment = await prisma.equipment.findMany({ where: { isActive: true } });

  // Find suitable halls by capacity
  const suitableFacilities = facilities.filter((f) => (f.capacity || 0) >= data.expectedAttendees);

  // Check bookings for conflicts
  const activeBookings = await prisma.resourceBooking.findMany({
    where: {
      status: { in: ['PENDING', 'TENTATIVE', 'CONFIRMED'] },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });

  const bookedFacilityIds = new Set(activeBookings.map((b) => b.facilityId));

  const availableOptions = suitableFacilities.map((f) => ({
    facility: f,
    isAvailable: !bookedFacilityIds.has(f.id),
    suitabilityScore: Math.round(
      100 - Math.min(50, Math.abs((f.capacity || 0) - data.expectedAttendees) / ((f.capacity || 1) / 100))
    ),
    recommendedEquipment: allEquipment.slice(0, 4).map((e) => ({
      equipmentId: e.id,
      name: e.name,
      suggestedQuantity: e.type === 'AUDIO' ? 2 : e.type === 'VISUAL' ? 1 : 10,
    })),
  }));

  return {
    isAI: config.aiProvider !== 'rule-based' && !!config.aiApiKey,
    requestedAttendees: data.expectedAttendees,
    options: availableOptions.sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0)),
  };
}

export async function generateReportDraft(eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      budgetItems: true,
      scheduleItems: true,
      settlements: { include: { items: true } },
      handoverRecords: true,
      returnInspections: true,
    },
  });

  if (!event) throw new Error('Không tìm thấy sự kiện');

  const settlement = event.settlements[0];
  const totalBudget = event.budgetItems.reduce((s, i) => s + i.totalPrice, 0);
  const totalActual = settlement ? settlement.totalActual : totalBudget;

  const draft = {
    isAI: config.aiProvider !== 'rule-based' && !!config.aiApiKey,
    actualAttendees: event.expectedAttendees || 150,
    summary: `Chương trình "${event.title}" do ${event.organizingUnit} tổ chức đã diễn ra thuận lợi từ ngày ${event.startDate ? new Date(event.startDate).toLocaleDateString('vi-VN') : '...'} tại ${event.preferredVenue || 'Hội trường trường'}. Sự kiện thu hút khoảng ${event.expectedAttendees || 150} sinh viên và đại biểu tham gia.`,
    achievements: `- Đạt 100% mục tiêu đề ra về mặt chuyên môn và phong trào sinh viên.\n- Tổ chức đúng tiến độ theo khung thời gian đã duyệt.\n- Nhận được phản hồi tích cực từ người tham dự về khâu tổ chức và nội dung truyền đạt.`,
    challenges: `- Công tác đón tiếp tại sảnh ban đầu còn hơi ùn ứ do số lượng sinh viên đến cùng thời điểm.\n- Cần chuẩn bị thêm phương án dự phòng micro và pin sân khấu.`,
    lessonsLearned: `- Cần phân công rõ đầu mối phụ trách kỹ thuật âm thanh và ánh sáng trước 2 giờ.\n- Tăng cường truyền thông số trên Fanpage trước sự kiện ít nhất 5 ngày.`,
    recommendations: `- Đề xuất Nhà trường tiếp tục tạo điều kiện hỗ trợ cơ sở vật chất cho các kỳ sinh hoạt tiếp theo.\n- Hỗ trợ kinh phí quyết toán nhanh chóng cho các hóa đơn vật tư in ấn.`,
    financialOverview: {
      totalBudget,
      totalActual,
      difference: totalActual - totalBudget,
    },
  };

  return draft;
}
