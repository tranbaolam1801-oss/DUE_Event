import path from 'path';
import { promises as fs } from 'fs';
import { createHash, randomUUID } from 'crypto';
import { config } from '../config';
import { isProductionRuntime } from '../config/runtime';

export class AttachmentError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
    readonly operation: string
  ) {
    super(message);
    this.name = 'AttachmentError';
  }
}

function usesPersistentStorage(): boolean {
  return isProductionRuntime();
}

export function validateAttachment(name: string, mime: string, bytes: Buffer) {
  const extension = path.extname(name).toLowerCase();
  const types: Record<string, string[]> = {
    '.pdf': ['application/pdf'], '.png': ['image/png'], '.jpg': ['image/jpeg'], '.jpeg': ['image/jpeg'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    '.doc': ['application/msword'], '.xls': ['application/vnd.ms-excel'],
  };
  if (!types[extension]) {
    throw new AttachmentError('Định dạng tệp không được hỗ trợ. Hãy chọn PDF, Word, Excel, PNG hoặc JPG.', 400, 'UNSUPPORTED_FILE_TYPE', 'validate');
  }
  if (!types[extension].includes(mime)) {
    throw new AttachmentError('Kiểu nội dung của tệp không khớp với phần mở rộng.', 400, 'FILE_TYPE_MISMATCH', 'validate');
  }
  if (!bytes.length) {
    throw new AttachmentError('Tệp tải lên đang trống.', 400, 'EMPTY_FILE', 'validate');
  }
  if (bytes.length > config.maxFileSize) {
    throw new AttachmentError(`Tệp vượt giới hạn ${Math.floor(config.maxFileSize / 1_000_000)} MB.`, 413, 'FILE_TOO_LARGE', 'validate');
  }
  const signature = bytes.subarray(0, 8).toString('hex');
  const valid = extension === '.pdf' ? bytes.subarray(0, 5).toString() === '%PDF-'
    : extension === '.png' ? signature === '89504e470d0a1a0a'
    : ['.jpg', '.jpeg'].includes(extension) ? signature.startsWith('ffd8ff')
    : ['.docx', '.xlsx'].includes(extension) ? signature.startsWith('504b0304')
    : signature === 'd0cf11e0a1b11ae1';
  if (!valid) {
    throw new AttachmentError('Nội dung tệp không khớp định dạng.', 400, 'INVALID_FILE_SIGNATURE', 'validate');
  }
  return extension;
}
function storageConfig() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (process.env.STORAGE_DRIVER !== 'supabase' || !base || !key || !bucket) {
    throw new AttachmentError(
      'Storage chưa được cấu hình đầy đủ. Quản trị viên cần kiểm tra các biến Storage trên Vercel Production.',
      503,
      'STORAGE_NOT_CONFIGURED',
      'configure'
    );
  }
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    throw new AttachmentError('Địa chỉ Supabase Storage không hợp lệ.', 503, 'STORAGE_NOT_CONFIGURED', 'configure');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new AttachmentError('Địa chỉ Supabase Storage không hợp lệ.', 503, 'STORAGE_NOT_CONFIGURED', 'configure');
  }
  return { base: base.replace(/\/$/, '') + '/storage/v1', bucket, headers: { apikey: key, Authorization: `Bearer ${key}` } };
}
async function storageFetch(operation: string, url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    throw new AttachmentError(
      timedOut ? 'Storage phản hồi quá thời gian cho phép. Vui lòng thử lại.' : 'Không kết nối được Supabase Storage.',
      timedOut ? 504 : 502,
      timedOut ? 'STORAGE_TIMEOUT' : 'STORAGE_UNAVAILABLE',
      operation
    );
  }
}

async function privateBucket() {
  const cfg = storageConfig();
  const response = await storageFetch(
    'check_bucket',
    `${cfg.base}/bucket/${encodeURIComponent(cfg.bucket)}`,
    { headers: cfg.headers },
    15000
  );
  if (response.status === 401 || response.status === 403) {
    throw new AttachmentError('Supabase Storage từ chối quyền truy cập. Quản trị viên cần kiểm tra cấu hình khóa Storage.', 503, 'STORAGE_AUTH_FAILED', 'check_bucket');
  }
  if (response.status === 404) {
    throw new AttachmentError('Không tìm thấy bucket chứng từ đã cấu hình trên Supabase Storage.', 503, 'STORAGE_BUCKET_NOT_FOUND', 'check_bucket');
  }
  if (!response.ok) {
    throw new AttachmentError('Không kiểm tra được bucket Supabase Storage.', 502, 'STORAGE_BUCKET_UNAVAILABLE', 'check_bucket');
  }
  let bucket: { public?: boolean };
  try {
    bucket = await response.json() as { public?: boolean };
  } catch {
    throw new AttachmentError('Supabase Storage trả về thông tin bucket không hợp lệ.', 502, 'STORAGE_INVALID_RESPONSE', 'check_bucket');
  }
  if (bucket.public !== false) {
    throw new AttachmentError('Bucket chứng từ phải tồn tại và ở chế độ private.', 503, 'STORAGE_BUCKET_NOT_PRIVATE', 'check_bucket');
  }
  return cfg;
}
export async function saveAttachment(
  eventId: string,
  name: string,
  mime: string,
  bytes: Buffer,
  idempotencyKey?: string
) {
  const extension = validateAttachment(name, mime, bytes);
  const digest = idempotencyKey ? `-${createHash('sha256').update(bytes).digest('hex').slice(0, 16)}` : '';
  const fileName = `${idempotencyKey || randomUUID()}${digest}${extension}`;
  if (usesPersistentStorage()) {
    const cfg = await privateBucket();
    const objectKey = `${encodeURIComponent(eventId)}/${fileName}`;
    const response = await storageFetch(
      'upload',
      `${cfg.base}/object/${encodeURIComponent(cfg.bucket)}/${objectKey}`,
      {
        method: 'POST',
        headers: { ...cfg.headers, 'Content-Type': mime, 'x-upsert': idempotencyKey ? 'true' : 'false' },
        body: new Uint8Array(bytes),
      },
      30000
    );
    if (response.status === 401 || response.status === 403) {
      throw new AttachmentError('Supabase Storage từ chối quyền tải tệp lên.', 503, 'STORAGE_AUTH_FAILED', 'upload');
    }
    if (response.status === 413) {
      throw new AttachmentError('Supabase Storage từ chối tệp vì vượt giới hạn dung lượng.', 413, 'FILE_TOO_LARGE', 'upload');
    }
    if (!response.ok) {
      throw new AttachmentError('Không lưu được tệp vào Supabase Storage.', 502, 'STORAGE_UPLOAD_FAILED', 'upload');
    }
    return { fileName, filePath: `supabase://${cfg.bucket}/${objectKey}` };
  }
  const directory = path.resolve(config.uploadDir);
  await fs.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, fileName);
  await fs.writeFile(filePath, bytes, { flag: idempotencyKey ? 'w' : 'wx' });
  return { fileName, filePath };
}
export async function removeAttachment(filePath: string) {
  if (filePath.startsWith('supabase://')) {
    if (!usesPersistentStorage()) {
      throw new AttachmentError('Tệp thuộc Cloud Storage và không khả dụng trong chế độ local.', 409, 'REMOTE_FILE_IN_LOCAL_MODE', 'delete');
    }
    const cfg = await privateBucket();
    const prefix = `supabase://${cfg.bucket}/`;
    if (!filePath.startsWith(prefix)) throw new AttachmentError('Storage bucket không khớp.', 400, 'STORAGE_BUCKET_MISMATCH', 'delete');
    const key = filePath.slice(prefix.length);
    if (key.split('/').some(part => !part || part === '..' || part === '.')) {
      throw new AttachmentError('Đường dẫn tệp không hợp lệ.', 400, 'INVALID_STORAGE_PATH', 'delete');
    }
    const response = await storageFetch(
      'delete',
      `${cfg.base}/object/${encodeURIComponent(cfg.bucket)}/${key}`,
      { method: 'DELETE', headers: cfg.headers },
      30000
    );
    if (!response.ok) {
      throw new AttachmentError('Không xóa được tệp khỏi Supabase Storage.', 502, 'STORAGE_DELETE_FAILED', 'delete');
    }
    return;
  }
  const root = await fs.realpath(path.resolve(config.uploadDir));
  const localPath = await fs.realpath(path.resolve(filePath));
  const relative = path.relative(root, localPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new AttachmentError('Đường dẫn tệp không hợp lệ.', 400, 'INVALID_STORAGE_PATH', 'delete');
  }
  await fs.unlink(localPath);
}

export async function assertAttachmentObjectExists(filePath: string): Promise<void> {
  if (!filePath.startsWith('supabase://')) {
    if (usesPersistentStorage()) {
      throw new AttachmentError('Chứng từ không được lưu trong Supabase Storage khi chạy Production.', 409, 'PERSISTENT_FILE_REQUIRED', 'verify');
    }
    const location = await resolveAttachment(filePath);
    if ('localPath' in location) {
      try {
        const stats = await fs.stat(location.localPath);
        if (!stats.isFile()) throw new Error('not a file');
      } catch {
        throw new AttachmentError('Không tìm thấy tệp chứng từ đã lưu.', 409, 'STORAGE_OBJECT_NOT_FOUND', 'verify');
      }
    }
    return;
  }
  if (!usesPersistentStorage()) {
    throw new AttachmentError('Tệp thuộc Cloud Storage và không khả dụng trong chế độ local.', 409, 'REMOTE_FILE_IN_LOCAL_MODE', 'verify');
  }
  const cfg = await privateBucket();
  const prefix = `supabase://${cfg.bucket}/`;
  if (!filePath.startsWith(prefix)) {
    throw new AttachmentError('Storage bucket của chứng từ không khớp cấu hình.', 409, 'STORAGE_BUCKET_MISMATCH', 'verify');
  }
  const key = filePath.slice(prefix.length);
  if (key.split('/').some(part => !part || part === '..' || part === '.')) {
    throw new AttachmentError('Đường dẫn chứng từ không hợp lệ.', 409, 'INVALID_STORAGE_PATH', 'verify');
  }
  const response = await storageFetch(
    'verify',
    `${cfg.base}/object/${encodeURIComponent(cfg.bucket)}/${key}`,
    { method: 'HEAD', headers: cfg.headers },
    15000
  );
  if (response.status === 404) {
    throw new AttachmentError('Không tìm thấy tệp chứng từ trong Supabase Storage.', 409, 'STORAGE_OBJECT_NOT_FOUND', 'verify');
  }
  if (response.status === 401 || response.status === 403) {
    throw new AttachmentError('Supabase Storage từ chối kiểm tra tệp chứng từ.', 503, 'STORAGE_AUTH_FAILED', 'verify');
  }
  if (!response.ok) {
    throw new AttachmentError('Không xác minh được tệp chứng từ trên Supabase Storage.', 502, 'STORAGE_VERIFY_FAILED', 'verify');
  }
}

export async function resolveAttachment(filePath: string, download = false): Promise<{ url: string } | { localPath: string }> {
  if (filePath.startsWith('supabase://')) {
    if (!usesPersistentStorage()) {
      throw new AttachmentError('Tệp thuộc Cloud Storage và không khả dụng trong chế độ local.', 409, 'REMOTE_FILE_IN_LOCAL_MODE', 'sign');
    }
    const cfg = await privateBucket();
    const prefix = `supabase://${cfg.bucket}/`;
    if (!filePath.startsWith(prefix)) throw new AttachmentError('Storage bucket không khớp.', 400, 'STORAGE_BUCKET_MISMATCH', 'sign');
    const key = filePath.slice(prefix.length);
    if (key.split('/').some(part => !part || part === '..' || part === '.')) {
      throw new AttachmentError('Đường dẫn tệp không hợp lệ.', 400, 'INVALID_STORAGE_PATH', 'sign');
    }
    const response = await storageFetch(
      'sign',
      `${cfg.base}/object/sign/${encodeURIComponent(cfg.bucket)}/${key}`,
      {
        method: 'POST',
        headers: { ...cfg.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 60, ...(download ? { download: true } : {}) }),
      },
      15000
    );
    if (response.status === 401 || response.status === 403) {
      throw new AttachmentError('Supabase Storage từ chối tạo liên kết tạm thời.', 503, 'STORAGE_AUTH_FAILED', 'sign');
    }
    if (!response.ok) {
      throw new AttachmentError('Không tạo được liên kết tạm thời cho chứng từ.', 502, 'STORAGE_SIGN_FAILED', 'sign');
    }
    let result: { signedURL?: string };
    try {
      result = await response.json() as { signedURL?: string };
    } catch {
      throw new AttachmentError('Supabase Storage trả về liên kết không hợp lệ.', 502, 'STORAGE_INVALID_RESPONSE', 'sign');
    }
    if (typeof result.signedURL !== 'string') {
      throw new AttachmentError('Supabase Storage không trả liên kết tạm thời hợp lệ.', 502, 'STORAGE_INVALID_RESPONSE', 'sign');
    }
    const url = new URL(cfg.base + result.signedURL);
    if (url.origin !== new URL(cfg.base).origin) {
      throw new AttachmentError('Supabase Storage trả về URL không hợp lệ.', 502, 'STORAGE_INVALID_RESPONSE', 'sign');
    }
    return { url: url.toString() };
  }
  const root = await fs.realpath(path.resolve(config.uploadDir));
  const localPath = await fs.realpath(path.resolve(filePath));
  const relative = path.relative(root, localPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new AttachmentError('Đường dẫn tệp không hợp lệ.', 400, 'INVALID_STORAGE_PATH', 'resolve');
  }
  return { localPath };
}
