const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', '..', '..', '..', '..', 'frontend', 'src', 'services', 'api.ts');
// Use absolute path
const absPath = 'e:\\Đại học\\Năm 3\\Quản lý quy trình kinh doanh\\Code\\event_manage-main\\event_manage-main\\frontend\\src\\services\\api.ts';

let content = fs.readFileSync(absPath, 'utf8');

// Replace token storage functions to support both localStorage and sessionStorage
const oldFunctions = `export function getAuthToken(): string | null {
  return localStorage.getItem('eventflow_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('eventflow_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('eventflow_token');
}`;

const newFunctions = `export function getAuthToken(): string | null {
  return localStorage.getItem('eventflow_token') || sessionStorage.getItem('eventflow_token');
}

export function setAuthToken(token: string, remember = true): void {
  if (remember) {
    localStorage.setItem('eventflow_token', token);
    sessionStorage.removeItem('eventflow_token');
  } else {
    sessionStorage.setItem('eventflow_token', token);
    localStorage.removeItem('eventflow_token');
  }
}

export function removeAuthToken(): void {
  localStorage.removeItem('eventflow_token');
  sessionStorage.removeItem('eventflow_token');
}`;

content = content.replace(oldFunctions, newFunctions);
fs.writeFileSync(absPath, content, 'utf8');
console.log('api.ts patched successfully');
