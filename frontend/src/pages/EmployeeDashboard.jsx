import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { useThemeStore } from '../store/authStore';
import { getProfile, clock as apiClock, updateProfile, requestLeave, getLeaveRequests, getLeaveSummary } from '../api/api';

const leaveTypeOptions = ['SICK', 'CASUAL', 'ANNUAL', 'UNPAID'];

export default function EmployeeDashboard() {
  const { accessToken, user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [leaveForm, setLeaveForm] = useState({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveSummary, setLeaveSummary] = useState(null);
  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', address: '', emergencyContact: '', department: '', designation: '' });

  const loadDashboardData = async () => {
    if (!accessToken) return;
    try {
      const profileRes = await getProfile(accessToken);
      if (profileRes.success && profileRes.data) {
        setProfile(profileRes.data);
        setProfileForm({
          firstName: profileRes.data.firstName || '',
          lastName: profileRes.data.lastName || '',
          phone: profileRes.data.phone || '',
          address: profileRes.data.address || '',
          emergencyContact: profileRes.data.emergencyContact || '',
          department: profileRes.data.department || '',
          designation: profileRes.data.designation || '',
        });
      }
      const leaveRes = await getLeaveRequests(accessToken);
      if (leaveRes.success) setLeaveRequests(leaveRes.data || []);
      const summaryRes = await getLeaveSummary(accessToken);
      if (summaryRes.success) setLeaveSummary(summaryRes.data || null);
    } catch (err) {
      setMessage(err.message || 'Failed to load dashboard');
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [accessToken]);

  async function handleClock() {
    try {
      const res = await apiClock(accessToken);
      if (res.success) setMessage(res.message || 'Success');
      else setMessage(res.message || 'Action failed');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleProfileSave(e) {
    e.preventDefault();
    try {
      const res = await updateProfile(accessToken, profileForm);
      if (res.success) {
        setProfile(res.data);
        setMessage('Profile updated successfully');
      } else {
        setMessage(res.message || 'Profile update failed');
      }
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleLeaveSubmit(e) {
    e.preventDefault();
    try {
      const res = await requestLeave(accessToken, leaveForm);
      if (res.success) {
        setLeaveForm({ type: 'ANNUAL', startDate: '', endDate: '', reason: '' });
        setMessage('Leave request submitted');
        const leaveRes = await getLeaveRequests(accessToken);
        if (leaveRes.success) setLeaveRequests(leaveRes.data || []);
      } else {
        setMessage(res.message || 'Leave request failed');
      }
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    try {
      const fileInfos = files.map(f => ({ name: f.name, type: f.type }));
      const presignRes = await fetch('/api/employee/presign', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: fileInfos }),
      });
      const presignJson = await presignRes.json();
      if (!presignJson.success) return setMessage(presignJson.message || 'Failed to get upload URLs');

      const presigned = presignJson.data;
      for (const p of presigned) {
        const file = files.find(f => f.name === p.name);
        if (!file) continue;
        await fetch(p.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      }

      const registerRes = await fetch('/api/employee/register-file', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: presigned.map(p => ({ name: p.name, key: p.key, url: p.url })) }),
      });
      const registerJson = await registerRes.json();
      if (registerJson.success) {
        setProfile(registerJson.data);
        setMessage('Files uploaded');
      } else setMessage(registerJson.message || 'Upload failed');
    } catch (err) {
      setMessage(err.message);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'dark bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-emerald-50 via-white to-cyan-50'} p-6`}>
      <div className={`mx-auto max-w-7xl space-y-6 rounded-3xl border transition-colors ${isDark ? 'dark border-slate-700 bg-slate-800/90' : 'border-emerald-100 bg-white/90'} p-6 shadow-xl ${isDark ? 'shadow-slate-950' : 'shadow-emerald-100'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Employee</p>
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`rounded-full px-4 py-2 text-sm font-medium transition ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className={`rounded-full px-4 py-2 text-sm font-medium ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-emerald-100 text-emerald-700'}`}>{user?.email}</div>
            <button onClick={handleLogout} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500">
              Logout
            </button>
          </div>
        </div>

        {message && <div className={`rounded-xl px-4 py-3 text-sm transition-colors ${isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>{message}</div>}

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-200">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Leave Balance</p>
            <div className="mt-2 text-3xl font-bold">{leaveSummary ? Object.values(leaveSummary.balance || {}).reduce((sum, value) => sum + Number(value || 0), 0) : 0}</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 p-5 text-white shadow-lg shadow-cyan-200">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Approved</p>
            <div className="mt-2 text-3xl font-bold">{leaveSummary?.approvedDays || 0}</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-amber-200">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-100">Pending</p>
            <div className="mt-2 text-3xl font-bold">{leaveSummary?.pendingDays || 0}</div>
          </div>
          <button onClick={handleClock} className="rounded-2xl bg-slate-900 px-5 py-5 text-left font-semibold text-white shadow-md shadow-slate-200 transition hover:bg-slate-800">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Attendance</p>
            <div className="mt-2 text-2xl">Clock In / Out</div>
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xl font-semibold text-slate-800">Edit Profile</h3>
            <form className="mt-4 space-y-3" onSubmit={handleProfileSave}>
              <div className="grid gap-3 md:grid-cols-2">
                <input value={profileForm.firstName} onChange={e => setProfileForm({ ...profileForm, firstName: e.target.value })} placeholder="First name" className="rounded-xl border border-slate-200 bg-white p-3" />
                <input value={profileForm.lastName} onChange={e => setProfileForm({ ...profileForm, lastName: e.target.value })} placeholder="Last name" className="rounded-xl border border-slate-200 bg-white p-3" />
              </div>
              <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="Phone" className="w-full rounded-xl border border-slate-200 bg-white p-3" />
              <input value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Address" className="w-full rounded-xl border border-slate-200 bg-white p-3" />
              <input value={profileForm.emergencyContact} onChange={e => setProfileForm({ ...profileForm, emergencyContact: e.target.value })} placeholder="Emergency Contact" className="w-full rounded-xl border border-slate-200 bg-white p-3" />
              <div className="grid gap-3 md:grid-cols-2">
                <input value={profileForm.department} onChange={e => setProfileForm({ ...profileForm, department: e.target.value })} placeholder="Department" className="rounded-xl border border-slate-200 bg-white p-3" />
                <input value={profileForm.designation} onChange={e => setProfileForm({ ...profileForm, designation: e.target.value })} placeholder="Designation" className="rounded-xl border border-slate-200 bg-white p-3" />
              </div>
              <button type="submit" className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white">Save Profile</button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xl font-semibold text-slate-800">Apply for Leave</h3>
            <form className="mt-4 space-y-3" onSubmit={handleLeaveSubmit}>
              <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white p-3">
                {leaveTypeOptions.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} className="rounded-xl border border-slate-200 bg-white p-3" required />
                <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} className="rounded-xl border border-slate-200 bg-white p-3" required />
              </div>
              <textarea value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Reason for leave" className="w-full rounded-xl border border-slate-200 bg-white p-3" rows={3} />
              <button type="submit" className="rounded-xl bg-cyan-600 px-5 py-3 font-semibold text-white">Submit Leave</button>
            </form>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xl font-semibold text-slate-800">Leave Status</h3>
            <div className="mt-4 space-y-3">
              {leaveRequests.length === 0 ? <p className="text-slate-500">No leave history yet.</p> : leaveRequests.map(item => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-700">{item.type}</span>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : item.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}</p>
                  <p className="text-sm text-slate-500">{item.reason || 'No reason provided'}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xl font-semibold text-slate-800">Leave Days</h3>
            {leaveSummary ? (
              <div className="mt-4 space-y-4">
                {Object.entries(leaveSummary.balance || {}).map(([type, days]) => (
                  <div key={type} className="flex items-center justify-between rounded-xl bg-white p-3">
                    <span className="font-medium text-slate-700">{type}</span>
                    <span className="text-sm font-semibold text-emerald-600">{days} days</span>
                  </div>
                ))}
              </div>
            ) : <p className="mt-3 text-slate-500">Loading leave summary...</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-semibold text-slate-800">Documents</h3>
          <input type="file" multiple onChange={handleUpload} className="mt-4 block w-full rounded-xl border border-dashed border-emerald-300 bg-white p-3 text-sm text-slate-600" />
        </div>
      </div>
    </div>
  );
}
