import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractBudgetPreview, extractExcelPreview, extractSchedulePreview } from './eventFileExtraction';

describe('event file preview extraction', () => {
  it('extracts timeline rows without changing the source table', () => {
    const preview = extractSchedulePreview([
      ['Ghi chú'],
      ['Khung giờ', 'Nội dung hoạt động', 'Phụ trách'],
      ['08:00 - 08:30', 'Khai mạc', 'Ban tổ chức'],
    ]);
    assert.deepEqual(preview.rows, [{
      timeSlot: '08:00 - 08:30',
      activity: 'Khai mạc',
      responsible: 'Ban tổ chức',
    }]);
    assert.deepEqual(preview.warnings, []);
  });

  it('recomputes budget totals and warns about inconsistent imported totals', () => {
    const preview = extractBudgetPreview([
      ['Khoản chi', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Thành tiền'],
      ['Nước uống', 'thùng', 2, 100000, 190000],
    ]);
    assert.equal(preview.rows[0].totalPrice, 200000);
    assert.equal(preview.rows[0].unit, 'thùng');
    assert.match(preview.warnings[0], /số lượng × đơn giá/);
  });

  it('does not invent preview values when the expected columns are absent', () => {
    assert.deepEqual(extractSchedulePreview([['Nội dung'], ['Khai mạc']]), {
      rows: [],
      warnings: ['Không tìm thấy cột khung giờ và nội dung để trích xuất.'],
    });
    assert.deepEqual(extractBudgetPreview([['Khoản chi'], ['Nước uống']]), {
      rows: [],
      warnings: ['Không tìm thấy các cột khoản chi, số lượng và đơn giá để trích xuất.'],
    });
  });

  it('reads an actual XLSX workbook before presenting the extracted preview', async () => {
    const exceljs = await import('exceljs');
    const workbook = new exceljs.default.Workbook();
    workbook.addWorksheet('Timeline').addRows([
      ['Khung giờ', 'Nội dung hoạt động', 'Người phụ trách'],
      ['08:00 - 08:30', 'Khai mạc', 'Ban tổ chức'],
    ]);
    const file = new Blob([await workbook.xlsx.writeBuffer()]) as File;
    const preview = await extractExcelPreview(file, 'timeline');
    assert.deepEqual(preview.rows, [{
      timeSlot: '08:00 - 08:30',
      activity: 'Khai mạc',
      responsible: 'Ban tổ chức',
    }]);

    const budgetWorkbook = new exceljs.default.Workbook();
    budgetWorkbook.addWorksheet('Dự trù').addRows([
      ['Khoản chi', 'Đơn vị tính', 'Số lượng', 'Đơn giá', 'Thành tiền'],
      ['Nước uống', 'thùng', 2, 100000, 200000],
    ]);
    const budgetFile = new Blob([await budgetWorkbook.xlsx.writeBuffer()]) as File;
    const budgetPreview = await extractExcelPreview(budgetFile, 'budget');
    assert.deepEqual(budgetPreview.rows, [{
      category: 'Chi phí khác',
      itemName: 'Nước uống',
      quantity: 2,
      unitPrice: 100000,
      totalPrice: 200000,
      unit: 'thùng',
    }]);
  });
});
