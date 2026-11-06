import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding EventFlow database...');

  // Clean old data in safe sequence
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.incidentReport.deleteMany();
  await prisma.returnInspection.deleteMany();
  await prisma.handoverRecord.deleteMany();
  await prisma.financialDocument.deleteMany();
  await prisma.settlementItem.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.eventReport.deleteMany();
  await prisma.resourceBookingItem.deleteMany();
  await prisma.resourceBooking.deleteMany();
  await prisma.budgetItem.deleteMany();
  await prisma.eventScheduleItem.deleteMany();
  await prisma.eventVersion.deleteMany();
  await prisma.approvalDecision.deleteMany();
  await prisma.workflowHistory.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 1. Create Users
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      id: 'u-admin',
      email: 'admin@eventflow.vn',
      passwordHash,
      fullName: 'Lê Hoàng Admin',
      role: 'ADMIN',
      department: 'Trung tâm Công nghệ Thông tin',
      phone: '0905111222',
    },
  });

  const btc1 = await prisma.user.create({
    data: {
      id: 'u-btc1',
      email: 'btc1@eventflow.vn',
      passwordHash,
      fullName: 'Nguyễn Văn An',
      role: 'BTC',
      department: 'CLB Tin học DUE (IT Club)',
      phone: '0914222333',
    },
  });

  const btc2 = await prisma.user.create({
    data: {
      id: 'u-btc2',
      email: 'btc2@eventflow.vn',
      passwordHash,
      fullName: 'Trần Thị Bình',
      role: 'BTC',
      department: 'Liên Chi đoàn Khoa Quản trị Kinh doanh',
      phone: '0935333444',
    },
  });

  const bcn = await prisma.user.create({
    data: {
      id: 'u-bcn',
      email: 'bcnkhoa@eventflow.vn',
      passwordHash,
      fullName: 'PGS.TS. Lê Văn Cường',
      role: 'BCN_KHOA',
      department: 'Ban Chủ nhiệm Khoa QTKD',
      phone: '0903555666',
    },
  });

  const doan = await prisma.user.create({
    data: {
      id: 'u-doan',
      email: 'doantruong@eventflow.vn',
      passwordHash,
      fullName: 'ThS. Phạm Thị Dung',
      role: 'DOAN_TRUONG',
      department: 'Văn phòng Đoàn Thanh niên - Hội Sinh viên',
      phone: '0905777888',
    },
  });

  const csvc = await prisma.user.create({
    data: {
      id: 'u-csvc',
      email: 'csvc@eventflow.vn',
      passwordHash,
      fullName: 'Nguyễn Hữu Em',
      role: 'CSVC',
      department: 'Phòng Cơ sở vật chất & Thiết bị',
      phone: '0913888999',
    },
  });

  const khtc = await prisma.user.create({
    data: {
      id: 'u-khtc',
      email: 'khtc@eventflow.vn',
      passwordHash,
      fullName: 'Trần Văn Phúc',
      role: 'KHTC',
      department: 'Phòng Kế hoạch - Tài chính',
      phone: '0905999000',
    },
  });

  // Additional DUE accounts for standard university format
  await prisma.user.createMany({
    data: [
      { id: 'u-btc-due', email: 'btc@due.edu.vn', passwordHash, fullName: 'Ban Tổ Chức DUE', role: 'BTC', department: 'CLB Kỹ Năng Doanh Nhân', phone: '0905123456' },
      { id: 'u-bcn-due', email: 'bcn@due.edu.vn', passwordHash, fullName: 'Ban Chủ Nhiệm Khoa', role: 'BCN_KHOA', department: 'Khoa Thương mại Điện tử', phone: '0905234567' },
      { id: 'u-doan-due', email: 'doantruong@due.edu.vn', passwordHash, fullName: 'Đoàn Trường DUE', role: 'DOAN_TRUONG', department: 'Đoàn Thanh niên DUE', phone: '0905345678' },
      { id: 'u-csvc-due', email: 'csvc@due.edu.vn', passwordHash, fullName: 'Phòng Quản Trị CSVC', role: 'CSVC', department: 'Phòng Quản trị Thiết bị', phone: '0905456789' },
      { id: 'u-khtc-due', email: 'khtc@due.edu.vn', passwordHash, fullName: 'Phòng Kế Hoạch Tài Chính', role: 'KHTC', department: 'Phòng Kế hoạch - Tài chính', phone: '0905567890' },
      { id: 'u-admin-due', email: 'admin@due.edu.vn', passwordHash, fullName: 'Quản Trị Hệ Thống DUE', role: 'ADMIN', department: 'Trung tâm CNTT DUE', phone: '0905678901' },
    ],
  });

  console.log('Created users (eventflow.vn & due.edu.vn).');

  // 2. Facilities
  const fac1 = await prisma.facility.create({
    data: {
      id: 'fac-1',
      code: 'HT-A',
      name: 'Hội trường A (Khu nhà Đa năng)',
      location: 'Tầng 2, Tòa nhà Đa năng A1',
      capacity: 500,
      type: 'HALL',
      description: 'Hội trường trung tâm với hệ thống âm thanh, máy chiếu siêu nét và sân khấu tiêu chuẩn.',
      amenities: JSON.stringify(['Máy chiếu Laser', 'Âm thanh Line Array', 'Micro x 8', 'Sân khấu 12x6m']),
    },
  });

  const fac2 = await prisma.facility.create({
    data: {
      id: 'fac-2',
      code: 'HT-B',
      name: 'Hội trường B (Khu nhà B)',
      location: 'Tầng 1, Tòa nhà B',
      capacity: 250,
      type: 'HALL',
      description: 'Hội trường phân tầng phù hợp cho hội thảo khoa học và báo cáo chuyên đề.',
      amenities: JSON.stringify(['Máy chiếu Full HD', 'Âm thanh vòm', 'Micro để bàn x 4']),
    },
  });

  const fac3 = await prisma.facility.create({
    data: {
      id: 'fac-3',
      code: 'SEM-402',
      name: 'Phòng Seminar Đa Năng 402',
      location: 'Tầng 4, Tòa nhà E',
      capacity: 80,
      type: 'ROOM',
      description: 'Không gian mở có bàn ghế module di chuyển linh hoạt cho workshop nhóm.',
      amenities: JSON.stringify(['Màn hình tương tác 85 inch', 'Bảng trắng di động x 4']),
    },
  });

  const fac4 = await prisma.facility.create({
    data: {
      id: 'fac-4',
      code: 'PH-301',
      name: 'Phòng họp Hội đồng 301',
      location: 'Tầng 3, Tòa nhà Hành chính',
      capacity: 40,
      type: 'ROOM',
      description: 'Phòng họp cao cấp phục vụ tiếp khách quốc tế và ký kết hợp tác.',
      amenities: JSON.stringify(['Micro hội thảo BOSCH', 'Camera họp trực tuyến']),
    },
  });

  const fac5 = await prisma.facility.create({
    data: {
      id: 'fac-5',
      code: 'SANH-T1',
      name: 'Sảnh Khánh Tiết & Triển lãm Tầng 1',
      location: 'Tầng trệt, Khu Trung tâm',
      capacity: 350,
      type: 'OUTDOOR',
      description: 'Sảnh thông tầng rộng rãi cho gian hàng triển lãm và check-in.',
      amenities: JSON.stringify(['Khu vực dựng gian hàng', 'Điện 3 pha']),
    },
  });

  const fac6 = await prisma.facility.create({
    data: {
      id: 'fac-6',
      code: 'SAN-TT',
      name: 'Sân Thể thao & Sự kiện Ngoài trời',
      location: 'Khu liên hợp Thể thao DUE',
      capacity: 1000,
      type: 'OUTDOOR',
      description: 'Mặt bằng sân ngoài trời có khán đài cho ngày hội thể thao lớn.',
      amenities: JSON.stringify(['Hệ thống đèn cao áp', 'Nguồn điện công suất lớn']),
    },
  });

  console.log('Created 6 facilities.');

  // 3. Equipment
  const eq1 = await prisma.equipment.create({
    data: { id: 'eq-1', code: 'MIC-WL', name: 'Micro không dây Shure SVX', type: 'AUDIO', totalQuantity: 20 },
  });
  const eq2 = await prisma.equipment.create({
    data: { id: 'eq-2', code: 'LOA-DD', name: 'Loa kéo di động JBL EON One', type: 'AUDIO', totalQuantity: 8 },
  });
  const eq3 = await prisma.equipment.create({
    data: { id: 'eq-3', code: 'MC-EPS', name: 'Máy chiếu di động Epson 4K', type: 'VISUAL', totalQuantity: 6 },
  });
  const eq4 = await prisma.equipment.create({
    data: { id: 'eq-4', code: 'BAN-GAP', name: 'Bàn lễ tân gấp phủ khăn nhung', type: 'FURNITURE', totalQuantity: 40 },
  });
  const eq5 = await prisma.equipment.create({
    data: { id: 'eq-5', code: 'GHE-XEP', name: 'Ghế xếp nệm cao cấp inox', type: 'FURNITURE', totalQuantity: 250 },
  });

  console.log('Created equipment items.');

  // 4. Create Events with full relations
  // Event 1: Completed
  const ev1 = await prisma.event.create({
    data: {
      id: 'ev-1',
      eventCode: 'EV-2024-001',
      title: 'Cuộc thi Hùng biện Tiếng Anh DUE SpeakUp 2024',
      description: 'Cuộc thi tranh biện tiếng Anh học thuật dành cho sinh viên.',
      objectives: 'Nâng cao kỹ năng giao tiếp và tư duy phản biện quốc tế cho sinh viên.',
      targetAudience: 'Sinh viên toàn trường',
      expectedAttendees: 400,
      organizingUnit: 'CLB Tin học DUE (IT Club)',
      contactPerson: 'Nguyễn Văn An',
      contactEmail: 'btc1@eventflow.vn',
      contactPhone: '0914222333',
      startDate: new Date('2026-10-15T08:00:00Z'),
      endDate: new Date('2026-10-15T18:00:00Z'),
      preferredVenue: 'Hội trường A (Khu nhà Đa năng)',
      status: 'COMPLETED',
      permitStatus: 'ISSUED',
      facilityStatus: 'RETURNED',
      inspectionStatus: 'PASSED',
      settlementStatus: 'SETTLED',
      reportStatus: 'ACCEPTED',
      createdById: btc1.id,
      budgetItems: {
        create: [
          { category: 'In ấn', itemName: 'Backdrop & Standee', quantity: 1, unitPrice: 2500000, totalPrice: 2500000 },
          { category: 'Giải thưởng', itemName: 'Tiền thưởng các giải', quantity: 1, unitPrice: 8000000, totalPrice: 8000000 },
        ],
      },
      scheduleItems: {
        create: [
          { timeSlot: '08:00 - 11:30', activity: 'Vòng thi Bán kết', responsible: 'Ban Chuyên môn' },
          { timeSlot: '14:00 - 17:30', activity: 'Chung kết & Trao giải', responsible: 'Ban Tổ chức' },
        ],
      },
      workflowHistory: {
        create: [
          { fromStatus: '', toStatus: 'DRAFT', action: 'CREATE', actorName: 'Nguyễn Văn An', actorRole: 'BTC' },
          { fromStatus: 'DRAFT', toStatus: 'SUBMITTED', action: 'SUBMIT', actorName: 'Nguyễn Văn An', actorRole: 'BTC' },
          { fromStatus: 'SUBMITTED', toStatus: 'FACULTY_APPROVED', action: 'APPROVE', actorName: 'PGS.TS. Lê Văn Cường', actorRole: 'BCN_KHOA' },
          { fromStatus: 'FACULTY_APPROVED', toStatus: 'PERMIT_ISSUED', action: 'APPROVE', actorName: 'ThS. Phạm Thị Dung', actorRole: 'DOAN_TRUONG' },
          { fromStatus: 'PERMIT_ISSUED', toStatus: 'COMPLETED', action: 'COMPLETE', actorName: 'ThS. Phạm Thị Dung', actorRole: 'DOAN_TRUONG' },
        ],
      },
    },
  });

  // Event 2: Waiting for BCN Khoa
  const ev2 = await prisma.event.create({
    data: {
      id: 'ev-2',
      eventCode: 'EV-2024-002',
      title: 'Ngày hội Việc làm & Kết nối Doanh nghiệp Career Fair 2024',
      description: 'Quy tụ hơn 30 doanh nghiệp tài chính, ngân hàng tuyển dụng trực tiếp.',
      objectives: 'Kết nối việc làm cho tối thiểu 300 sinh viên sắp tốt nghiệp.',
      targetAudience: 'Sinh viên năm 3, 4',
      expectedAttendees: 600,
      organizingUnit: 'Liên Chi đoàn Khoa Quản trị Kinh doanh',
      contactPerson: 'Trần Thị Bình',
      contactEmail: 'btc2@eventflow.vn',
      contactPhone: '0935333444',
      startDate: new Date('2026-11-10T07:30:00Z'),
      endDate: new Date('2026-11-10T17:00:00Z'),
      preferredVenue: 'Hội trường A (Khu nhà Đa năng)',
      status: 'FACULTY_REVIEW',
      createdById: btc2.id,
      budgetItems: {
        create: [
          { category: 'Gian hàng', itemName: 'Thuê dựng 30 gian hàng', quantity: 30, unitPrice: 1200000, totalPrice: 36000000 },
        ],
      },
      workflowHistory: {
        create: [
          { fromStatus: 'DRAFT', toStatus: 'FACULTY_REVIEW', action: 'SUBMIT', actorName: 'Trần Thị Bình', actorRole: 'BTC' },
        ],
      },
    },
  });

  // Event 3: Revision Requested by Faculty
  const ev3 = await prisma.event.create({
    data: {
      id: 'ev-3',
      eventCode: 'EV-2024-003',
      title: 'Workshop Khởi nghiệp & Đổi mới sáng tạo DUE InnoLab',
      description: 'Chuyên đề huấn luyện Design Thinking cho các đề tài sinh viên.',
      objectives: 'Hoàn thiện hồ sơ cho 10 dự án tham gia khởi nghiệp cấp thành phố.',
      targetAudience: 'Các nhóm sinh viên khởi nghiệp',
      expectedAttendees: 70,
      organizingUnit: 'CLB Tin học DUE (IT Club)',
      contactPerson: 'Nguyễn Văn An',
      contactEmail: 'btc1@eventflow.vn',
      startDate: new Date('2026-11-05T08:00:00Z'),
      endDate: new Date('2026-11-05T12:00:00Z'),
      preferredVenue: 'Phòng Seminar Đa Năng 402',
      status: 'FACULTY_REVISION_REQUESTED',
      createdById: btc1.id,
      approvalDecisions: {
        create: [
          {
            stage: 'FACULTY_REVIEW',
            decision: 'REVISION_REQUESTED',
            reason: 'Cần bổ sung CV diễn giả và làm rõ kết quả đầu ra',
            comments: 'Đề nghị BTC gửi lại trước 28/10',
            decidedById: bcn.id,
          },
        ],
      },
    },
  });

  // Event 4: Permit Issued
  const ev4 = await prisma.event.create({
    data: {
      id: 'ev-4',
      eventCode: 'EV-2024-004',
      title: 'Lễ Tuyên dương Sinh viên 5 Tốt & Chào đón Tân Sinh viên K50',
      description: 'Vinh danh các cá nhân, tập thể đạt danh hiệu Sinh viên 5 Tốt.',
      objectives: 'Tuyên dương 120 danh hiệu Sinh viên 5 Tốt.',
      expectedAttendees: 500,
      organizingUnit: 'Liên Chi đoàn Khoa Quản trị Kinh doanh',
      contactPerson: 'Trần Thị Bình',
      startDate: new Date('2026-11-18T18:00:00Z'),
      endDate: new Date('2026-11-18T21:30:00Z'),
      preferredVenue: 'Hội trường A (Khu nhà Đa năng)',
      status: 'PERMIT_ISSUED',
      permitStatus: 'ISSUED',
      createdById: btc2.id,
      resourceBookings: {
        create: {
          facilityId: fac1.id,
          startTime: new Date('2026-11-18T16:00:00Z'),
          endTime: new Date('2026-11-18T22:00:00Z'),
          status: 'CONFIRMED',
        },
      },
    },
  });

  // Event 5: Facility Conflict (Same hall & time as Event 4)
  const ev5 = await prisma.event.create({
    data: {
      id: 'ev-5',
      eventCode: 'EV-2024-005',
      title: 'Đại nhạc hội Chào Tân Sinh viên Sparkling Night 2024',
      description: 'Đêm nhạc hội giao lưu nghệ thuật.',
      expectedAttendees: 800,
      organizingUnit: 'Liên Chi đoàn Khoa Quản trị Kinh doanh',
      contactPerson: 'Trần Thị Bình',
      startDate: new Date('2026-11-18T17:00:00Z'),
      endDate: new Date('2026-11-18T22:00:00Z'),
      preferredVenue: 'Hội trường A (Khu nhà Đa năng)',
      status: 'FACILITY_CONFLICT',
      createdById: btc2.id,
      resourceBookings: {
        create: {
          facilityId: fac1.id,
          startTime: new Date('2026-11-18T17:00:00Z'),
          endTime: new Date('2026-11-18T22:00:00Z'),
          status: 'PENDING',
          alternativeOption: 'Chuyển sang Sân Thể thao Ngoài trời',
        },
      },
    },
  });

  // Event 6: Waiting for inspection/return
  const ev6 = await prisma.event.create({
    data: {
      id: 'ev-6',
      eventCode: 'EV-2024-006',
      title: 'Giải Bóng đá Sinh viên DUE Champions League 2024',
      description: 'Giải đấu thể thao thường niên cho 24 đội bóng sinh viên.',
      expectedAttendees: 500,
      organizingUnit: 'Liên Chi đoàn Khoa Quản trị Kinh doanh',
      contactPerson: 'Trần Thị Bình',
      startDate: new Date('2026-10-20T07:00:00Z'),
      endDate: new Date('2026-10-24T18:00:00Z'),
      preferredVenue: 'Sân Thể thao & Sự kiện Ngoài trời',
      status: 'FACILITY_RETURN_PENDING',
      createdById: btc2.id,
    },
  });

  // Event 7: Waiting for finance settlement
  const ev7 = await prisma.event.create({
    data: {
      id: 'ev-7',
      eventCode: 'EV-2024-007',
      title: 'Chiến dịch Mùa hè xanh Tình nguyện vì Cộng đồng',
      description: 'Hoạt động tình nguyện hè hỗ trợ đồng bào vùng cao.',
      expectedAttendees: 60,
      organizingUnit: 'CLB Tin học DUE (IT Club)',
      contactPerson: 'Nguyễn Văn An',
      startDate: new Date('2026-08-01T06:00:00Z'),
      endDate: new Date('2026-08-10T18:00:00Z'),
      preferredVenue: 'Sảnh Khánh Tiết & Triển lãm Tầng 1',
      status: 'FINANCE_REVIEW',
      createdById: btc1.id,
      settlements: {
        create: {
          totalBudgeted: 30000000,
          totalActual: 29800000,
          difference: -200000,
          status: 'SUBMITTED',
          documents: {
            create: [
              { documentType: 'INVOICE', documentNumber: 'VAT-9921', amount: 14800000, description: 'Hóa đơn VAT vật tư công trình', isVerified: true },
              { documentType: 'RECEIPT', documentNumber: 'BN-100', amount: 15000000, description: 'Biên nhận tiền quà tặng học sinh', isVerified: false },
            ],
          },
        },
      },
    },
  });

  // 5. System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'hold_hours', value: '48', description: 'Thời gian giữ chỗ tạm thời (giờ)' },
      { key: 'max_budget_limit', value: '50000000', description: 'Hạn mức ngân sách cần thẩm định đặc biệt' },
      { key: 'max_file_size', value: '10485760', description: 'Dung lượng file tối đa (bytes)' },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
