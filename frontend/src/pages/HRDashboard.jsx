import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore, { useThemeStore } from '../store/authStore';
import { getApprovals, approveLeave, getDepartmentSummary, getEmployeeDirectory, updateEmployeeByHr } from '../api/api';

export default function HRDashboard() {
  const { accessToken, logout, user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState([]);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [employees, setEmployees] = useState([]);

  const loadData = async () => {
    if (!accessToken) return;
    try {
      const [approvalsRes, statsRes, deptRes, employeesRes] = await Promise.all([
        getApprovals(accessToken),
        fetch('/api/hr/stats', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => r.json()),
        getDepartmentSummary(accessToken),
        getEmployeeDirectory(accessToken)
      ]);

      if (approvalsRes.success) setApprovals(approvalsRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
      if (deptRes.success) setDepartmentSummary(deptRes.data || []);
      if (employeesRes.success) setEmployees(employeesRes.data || []);
    } catch (err) {
      setMessage(err.message || 'Failed to load HR dashboard');
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  async function handleDecision(id, approve) {
    try {
      const res = await approveLeave(accessToken, id, approve, approve ? 'Approved' : 'Rejected');
      if (res.success) {
        setMessage('Updated');
        setApprovals(prev => prev.filter(x => x.id !== id));
        await loadData();
      } else setMessage(res.message || 'Failed');
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function handleEmployeeUpdate(userId, field, value) {
    try {
      const res = await updateEmployeeByHr(accessToken, { userId, [field]: value });
      if (res.success) {
        setMessage('Employee updated');
        await loadData();
      } else setMessage(res.message || 'Update failed');
    } catch (err) {
      setMessage(err.message);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'dark bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-cyan-50 via-white to-indigo-50'} p-6`}>
      <div className={`mx-auto max-w-7xl space-y-6 rounded-3xl border transition-colors ${isDark ? 'dark border-slate-700 bg-slate-800/90' : 'border-cyan-100 bg-white/90'} p-6 shadow-xl ${isDark ? 'shadow-slate-950' : 'shadow-cyan-100'}`}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>HR</p>
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`rounded-full px-4 py-2 text-sm font-medium transition ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'}`}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
            <div className={`rounded-full px-4 py-2 text-sm font-medium ${isDark ? 'bg-slate-700 text-slate-200' : 'bg-cyan-100 text-cyan-700'}`}>{user?.email}</div>
            <button onClick={handleLogout} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500">
              Logout
            </button>
          </div>
        </div>

        {message && <div className={`rounded-xl px-4 py-3 text-sm transition-colors ${isDark ? 'bg-cyan-900/30 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>{message}</div>}

        <div className="grid gap-4 md:grid-cols-4">
          {stats ? (
            <>
              <div className="rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 p-5 text-white shadow-lg shadow-cyan-200">
                <h4 className="text-sm uppercase tracking-wide text-cyan-100">Total Employees</h4>
                <div className="mt-2 text-3xl font-bold">{stats.totalEmployees}</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 text-white shadow-lg shadow-emerald-200">
                <h4 className="text-sm uppercase tracking-wide text-emerald-100">Active Today</h4>
                <div className="mt-2 text-3xl font-bold">{stats.activeToday}</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 p-5 text-white shadow-lg shadow-amber-200">
                <h4 className="text-sm uppercase tracking-wide text-amber-100">Pending Leaves</h4>
                <div className="mt-2 text-3xl font-bold">{stats.pendingLeaves}</div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 p-5 text-white shadow-lg shadow-violet-200">
                <h4 className="text-sm uppercase tracking-wide text-violet-100">Departments</h4>
                <div className="mt-2 text-3xl font-bold">{departmentSummary.length}</div>
              </div>
            </>
          ) : (
            <p className="col-span-4 text-slate-500">Loading stats...</p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xl font-semibold text-slate-800">Pending Leave Applications</h3>
            <div className="mt-4 space-y-3">
              {approvals.length === 0 && <p className="rounded-xl bg-white p-4 text-slate-500">No pending requests</p>}
              {approvals.map(l => (
                <div key={l.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-lg font-semibold text-slate-800">{l.user.profile?.firstName} {l.user.profile?.lastName}</p>
                  <p className="mt-1 text-sm text-slate-600">{l.type} • {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}</p>
                  <p className="mt-2 text-sm text-slate-700">Reason: {l.reason}</p>
                  <div className="mt-3 flex gap-3">
                    <button onClick={() => handleDecision(l.id, true)} className="rounded-xl bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-500">Approve</button>
                    <button onClick={() => handleDecision(l.id, false)} className="rounded-xl bg-rose-600 px-4 py-2 font-medium text-white transition hover:bg-rose-500">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="text-xl font-semibold text-slate-800">Employees by Department</h3>
            <div className="mt-4 space-y-3">
              {departmentSummary.length === 0 ? <p className="text-slate-500">No department data</p> : departmentSummary.map(item => (
                <div key={item.department} className="flex items-center justify-between rounded-xl bg-white p-3">
                  <span className="font-medium text-slate-700">{item.department}</span>
                  <span className="rounded-full bg-cyan-100 px-2 py-1 text-sm font-semibold text-cyan-700">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-xl font-semibold text-slate-800">Manage Employees</h3>
          <div className="mt-4 space-y-3">
            {employees.map(employee => (
              <div key={employee.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{employee.profile?.firstName} {employee.profile?.lastName}</p>
                    <p className="text-sm text-slate-500">{employee.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <select defaultValue={employee.profile?.department || ''} onChange={(e) => handleEmployeeUpdate(employee.id, 'department', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm">
                      <option value="">Department</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                    <select defaultValue={employee.role} onChange={(e) => handleEmployeeUpdate(employee.id, 'role', e.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm">
                      <option value="EMPLOYEE">Employee</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
