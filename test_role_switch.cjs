const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path, token) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, res => {
      let b = '';
      res.on('data', d => b += d);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(b) }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function testRoleSwitching() {
  const roles = [
    { role: 'BTC', email: 'btc1@eventflow.vn' },
    { role: 'BCN_KHOA', email: 'bcnkhoa@eventflow.vn' },
    { role: 'DOAN_TRUONG', email: 'doantruong@eventflow.vn' },
    { role: 'CSVC', email: 'csvc@eventflow.vn' },
    { role: 'KHTC', email: 'khtc@eventflow.vn' },
    { role: 'ADMIN', email: 'admin@eventflow.vn' },
  ];

  console.log('--- TEST: Sequential Role Switching & Backend Permissions ---');
  for (const { role, email } of roles) {
    const loginRes = await post('/api/auth/login', { email, password: '123456' });
    const token = loginRes.data.data.token;
    
    // Verify getMe
    const meRes = await get('/api/auth/me', token);
    const permRes = await get('/api/auth/permissions', token);

    console.log(`Role: ${role.padEnd(12)} | User: ${meRes.data.data.fullName.padEnd(22)} | Backend Role: ${meRes.data.data.role.padEnd(12)} | Permissions count: ${permRes.data.data.permissions?.length}`);
  }
}

testRoleSwitching().catch(console.error);
