import path from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import { config } from '../config';

export function validateAttachment(name: string, mime: string, bytes: Buffer) {
  const extension = path.extname(name).toLowerCase();
  const types: Record<string, string[]> = {
    '.pdf': ['application/pdf'], '.png': ['image/png'], '.jpg': ['image/jpeg'], '.jpeg': ['image/jpeg'],
    '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    '.doc': ['application/msword'], '.xls': ['application/vnd.ms-excel'],
  };
  if (!types[extension]?.includes(mime) || !bytes.length || bytes.length > config.maxFileSize) throw new Error('Loại tệp hoặc dung lượng không hợp lệ');
  const signature = bytes.subarray(0, 8).toString('hex');
  const valid = extension === '.pdf' ? bytes.subarray(0, 5).toString() === '%PDF-'
    : extension === '.png' ? signature === '89504e470d0a1a0a'
    : ['.jpg', '.jpeg'].includes(extension) ? signature.startsWith('ffd8ff')
    : ['.docx', '.xlsx'].includes(extension) ? signature.startsWith('504b0304')
    : signature === 'd0cf11e0a1b11ae1';
  if (!valid) throw new Error('Nội dung tệp không khớp định dạng');
  return extension;
}
function storageConfig() {
  const base = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  if (!base || !key || !bucket || new URL(base).protocol !== 'https:') throw new Error('Chưa cấu hình Storage an toàn');
  return { base: base.replace(/\/$/, '') + '/storage/v1', bucket, headers: { apikey: key, Authorization: `Bearer ${key}` } };
}
async function privateBucket() {
  const cfg = storageConfig();
  const response = await fetch(`${cfg.base}/bucket/${encodeURIComponent(cfg.bucket)}`, { headers: cfg.headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok || (await response.json() as { public: boolean }).public !== false) throw new Error('Storage bucket phải tồn tại và ở chế độ private');
  return cfg;
}
export async function saveAttachment(eventId: string, name: string, mime: string, bytes: Buffer) {
  const extension = validateAttachment(name, mime, bytes);
  const fileName = randomUUID() + extension;
  if (process.env.STORAGE_DRIVER === 'supabase') {
    const cfg = await privateBucket();
    const objectKey = `${encodeURIComponent(eventId)}/${fileName}`;
    const response = await fetch(`${cfg.base}/object/${encodeURIComponent(cfg.bucket)}/${objectKey}`, {
      method: 'POST', headers: { ...cfg.headers, 'Content-Type': mime, 'x-upsert': 'false' },
      body: new Uint8Array(bytes), signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error('Không lưu được tệp vào Storage');
    return { fileName, filePath: `supabase://${cfg.bucket}/${objectKey}` };
  }
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) throw new Error('Production yêu cầu Storage bền vững');
  const directory = path.resolve(config.uploadDir);
  await fs.mkdir(directory, { recursive: true });
  const filePath = path.join(directory, fileName);
  await fs.writeFile(filePath, bytes, { flag: 'wx' });
  return { fileName, filePath };
}
export async function removeAttachment(filePath: string) {
  if (filePath.startsWith('supabase://')) {
    const cfg = await privateBucket();
    const prefix = `supabase://${cfg.bucket}/`;
    if (!filePath.startsWith(prefix)) throw new Error('Storage bucket không khớp');
    const key = filePath.slice(prefix.length);
    if (key.split('/').some(part => !part || part === '..' || part === '.')) throw new Error('Đường dẫn không hợp lệ');
    const response = await fetch(`${cfg.base}/object/${encodeURIComponent(cfg.bucket)}/${key}`, {
      method: 'DELETE', headers: cfg.headers, signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error('Không xóa được tệp khỏi Storage');
    return;
  }
  const root = await fs.realpath(path.resolve(config.uploadDir));
  const localPath = await fs.realpath(path.resolve(filePath));
  const relative = path.relative(root, localPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Đường dẫn tệp không hợp lệ');
  await fs.unlink(localPath);
}
export async function resolveAttachment(filePath: string, download = false): Promise<{ url: string } | { localPath: string }> {
  if (filePath.startsWith('supabase://')) {
    const cfg = await privateBucket();
    const prefix = `supabase://${cfg.bucket}/`;
    if (!filePath.startsWith(prefix)) throw new Error('Storage bucket không khớp');
    const key = filePath.slice(prefix.length);
    if (key.split('/').some(part => !part || part === '..' || part === '.')) throw new Error('Đường dẫn không hợp lệ');
    const response = await fetch(`${cfg.base}/object/sign/${encodeURIComponent(cfg.bucket)}/${key}`, {
      method: 'POST', headers: { ...cfg.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 60, ...(download ? { download: true } : {}) }), signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error('Không tạo được liên kết tải tệp');
    const result = await response.json() as { signedURL: string };
    const url = new URL(cfg.base + result.signedURL);
    if (url.origin !== new URL(cfg.base).origin) throw new Error('Storage URL không hợp lệ');
    return { url: url.toString() };
  }
  const root = await fs.realpath(path.resolve(config.uploadDir));
  const localPath = await fs.realpath(path.resolve(filePath));
  const relative = path.relative(root, localPath);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Đường dẫn tệp không hợp lệ');
  return { localPath };
}
