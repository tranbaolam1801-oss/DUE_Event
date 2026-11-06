export interface ExtractedScheduleRow {
  timeSlot: string;
  activity: string;
  responsible: string;
}

export interface ExtractedBudgetRow {
  category: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

export interface FilePreview<T> {
  rows: T[];
  warnings: string[];
}

type CellValue = string | number | boolean | Date | null | undefined;

function cellText(value: CellValue): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  return '';
}

function headerKey(value: CellValue): string {
  return cellText(value).toLocaleLowerCase('vi-VN')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

function columnIndex(headers: string[], choices: string[]): number {
  return headers.findIndex((header) => typeof header === 'string' && choices.some((choice) => header === choice || header.includes(choice)));
}

export async function readWorkbookRows(file: File): Promise<CellValue[][]> {
  const exceljs = await import('exceljs');
  const Workbook = exceljs.default.Workbook;
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  return sheet.getSheetValues().slice(1).map((row) => {
    if (!Array.isArray(row)) return [];
    return row.map((cell) => {
      if (cell && typeof cell === 'object' && 'result' in cell) {
        return (cell as { result?: CellValue }).result ?? null;
      }
      if (cell && typeof cell === 'object' && 'text' in cell) {
        return (cell as { text?: string }).text ?? null;
      }
      return cell as CellValue;
    });
  });
}

export function extractSchedulePreview(rows: CellValue[][]): FilePreview<ExtractedScheduleRow> {
  const timeChoices = ['khunggio', 'thoigian', 'time', 'timeslot', 'gio'];
  const startChoices = ['batdau', 'start', 'starttime', 'giobatdau'];
  const endChoices = ['ketthuc', 'end', 'endtime', 'gioketthuc'];
  const activityChoices = ['noidung', 'hoatdong', 'activity', 'chuongtrinh', 'tietmuc', 'sukien', 'content'];
  const responsibleChoices = ['nguoiphutrach', 'phutrach', 'responsible', 'nguoithuchien', 'nhanluc', 'pic'];

  const headerRowIndex = rows.findIndex((row) => {
    const headers = Array.from(row, headerKey);
    const hasTime = columnIndex(headers, timeChoices) >= 0 ||
      (columnIndex(headers, startChoices) >= 0 && columnIndex(headers, endChoices) >= 0);
    const hasActivity = columnIndex(headers, activityChoices) >= 0;
    return hasTime && hasActivity;
  });

  if (headerRowIndex < 0) return { rows: [], warnings: ['Không tìm thấy cột khung giờ và nội dung để trích xuất.'] };

  const headers = Array.from(rows[headerRowIndex], headerKey);
  const timeIndex = columnIndex(headers, timeChoices);
  const startIndex = columnIndex(headers, startChoices);
  const endIndex = columnIndex(headers, endChoices);
  const activityIndex = columnIndex(headers, activityChoices);
  const responsibleIndex = columnIndex(headers, responsibleChoices);

  const result: ExtractedScheduleRow[] = [];
  rows.slice(headerRowIndex + 1).forEach((row) => {
    let timeSlot = timeIndex >= 0 ? cellText(row[timeIndex]) : '';
    if (!timeSlot && startIndex >= 0 && endIndex >= 0) {
      const start = cellText(row[startIndex]);
      const end = cellText(row[endIndex]);
      if (start && end) timeSlot = `${start} – ${end}`;
      else if (start) timeSlot = start;
    }
    const activity = activityIndex >= 0 ? cellText(row[activityIndex]) : '';
    if (!timeSlot && !activity) return;
    if (!timeSlot || !activity) return;
    result.push({
      timeSlot,
      activity,
      responsible: responsibleIndex < 0 ? '' : cellText(row[responsibleIndex]),
    });
  });

  return {
    rows: result,
    warnings: result.length ? [] : ['Không tìm thấy dòng timeline đầy đủ dưới hàng tiêu đề.'],
  };
}

function numberValue(value: CellValue): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const text = cellText(value).replace(/[₫đ\sVNDvnd]/gi, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function extractBudgetPreview(rows: CellValue[][]): FilePreview<ExtractedBudgetRow> {
  const itemChoices = ['hangmuc', 'khoanchi', 'noidung', 'item', 'itemname', 'tenkhoanchi', 'noidungchi'];
  const qtyChoices = ['soluong', 'quantity', 'sl', 'qty'];
  const priceChoices = ['dongia', 'unitprice', 'giadonvi', 'price', 'gia'];
  const totalChoices = ['thanhtien', 'tongtien', 'total', 'totalprice', 'sotien'];
  const categoryChoices = ['nhomchiphi', 'phanloai', 'category', 'loai', 'nhom'];
  const unitChoices = ['donvitinh', 'unit', 'dvt'];

  const headerRowIndex = rows.findIndex((row) => {
    const headers = Array.from(row, headerKey);
    return columnIndex(headers, itemChoices) >= 0
      && columnIndex(headers, qtyChoices) >= 0
      && columnIndex(headers, priceChoices) >= 0;
  });

  if (headerRowIndex < 0) return { rows: [], warnings: ['Không tìm thấy các cột khoản chi, số lượng và đơn giá để trích xuất.'] };

  const headers = Array.from(rows[headerRowIndex], headerKey);
  const itemIndex = columnIndex(headers, itemChoices);
  const categoryIndex = columnIndex(headers, categoryChoices);
  const quantityIndex = columnIndex(headers, qtyChoices);
  const unitIndex = columnIndex(headers, unitChoices);
  const priceIndex = columnIndex(headers, priceChoices);
  const totalIndex = columnIndex(headers, totalChoices);
  const result: ExtractedBudgetRow[] = [];
  const warnings: string[] = [];

  rows.slice(headerRowIndex + 1).forEach((row, index) => {
    const itemName = cellText(row[itemIndex]);
    if (!itemName) return;

    // Phát hiện dòng tổng cộng để không tính trùng vào danh sách các khoản chi
    const normalizedItem = headerKey(itemName);
    if (
      normalizedItem.includes('tongcong') ||
      normalizedItem.includes('tongkinhphi') ||
      normalizedItem.includes('tongchi') ||
      normalizedItem.includes('tongngansach') ||
      normalizedItem === 'tong' ||
      normalizedItem === 'total'
    ) {
      return;
    }

    const quantity = numberValue(row[quantityIndex]);
    const unitPrice = numberValue(row[priceIndex]);
    const statedTotal = totalIndex < 0 ? undefined : numberValue(row[totalIndex]);
    if (quantity === undefined || unitPrice === undefined || quantity <= 0 || unitPrice < 0) {
      warnings.push(`Dòng ${headerRowIndex + index + 2}: thiếu hoặc sai số lượng/đơn giá; đã bỏ khỏi xem trước.`);
      return;
    }
    const computedTotal = quantity * unitPrice;
    if (statedTotal !== undefined && Math.abs(statedTotal - computedTotal) > 0.01) {
      warnings.push(`Dòng ${headerRowIndex + index + 2}: thành tiền trong tệp không bằng số lượng × đơn giá; sẽ dùng kết quả tính lại.`);
    }
    const unit = unitIndex < 0 ? '' : cellText(row[unitIndex]);
    result.push({
      category: categoryIndex < 0 ? 'Chi phí khác' : cellText(row[categoryIndex]) || 'Chi phí khác',
      itemName,
      quantity,
      unitPrice,
      totalPrice: computedTotal,
      unit,
    });
  });

  if (!result.length) warnings.push('Không tìm thấy khoản chi hợp lệ dưới hàng tiêu đề.');
  return { rows: result, warnings };
}

export async function extractExcelPreview(file: File, kind: 'timeline' | 'budget') {
  const rows = await readWorkbookRows(file);
  return kind === 'timeline' ? extractSchedulePreview(rows) : extractBudgetPreview(rows);
}
