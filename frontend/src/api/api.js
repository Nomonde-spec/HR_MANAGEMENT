const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

async function request(path, opts = {}) {
  const headers = opts.headers || {};
  const body = opts.body ? JSON.stringify(opts.body) : undefined;
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers, body });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || 'API error');
  return json;
}

export async function login(email, password) {
  return request('/auth/login', { method: 'POST', body: { email, password } });
}

export async function refreshToken(refreshToken) {
  return request('/auth/refresh', { method: 'POST', body: { refreshToken } });
}

export async function getProfile(token) {
  return fetch(`${API_BASE}/employee/profile`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

export async function clock(token) {
  return fetch(`${API_BASE}/employee/attendance/clock`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

export async function presignFiles(token, files) {
  return fetch(`${API_BASE}/employee/presign`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ files }) }).then(r => r.json());
}

export async function registerFiles(token, files) {
  return fetch(`${API_BASE}/employee/register-file`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ files }) }).then(r => r.json());
}

export async function updateProfile(token, data) {
  return fetch(`${API_BASE}/employee/profile`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json());
}

export async function requestLeave(token, payload) {
  return fetch(`${API_BASE}/employee/leave`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function getLeaveRequests(token, status) {
  const params = status ? `?status=${encodeURIComponent(status)}` : '';
  return fetch(`${API_BASE}/employee/leave${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());
}

export async function getLeaveSummary(token) {
  return fetch(`${API_BASE}/employee/leave-summary`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then(r => r.json());
}

export async function getApprovals(token) {
  return fetch(`${API_BASE}/hr/approvals`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

export async function approveLeave(token, id, approve, comment) {
  return fetch(`${API_BASE}/hr/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id, approve, comment }) }).then(r => r.json());
}

export async function getDepartmentSummary(token) {
  return fetch(`${API_BASE}/hr/department-summary`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

export async function getEmployeeDirectory(token) {
  return fetch(`${API_BASE}/hr/employees`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
}

export async function updateEmployeeByHr(token, payload) {
  return fetch(`${API_BASE}/hr/employee`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());
}

export async function getJobs() {
  return fetch(`${API_BASE}/applicant/jobs`).then(r => r.json());
}

export default { request };
