import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';
import JobSeekers from './pages/JobSeekers';
import { API_BASE } from './api/api';
import ProtectedRoute from './components/ProtectedRoute';
import ApplicantProtectedRoute from './components/ApplicantProtectedRoute';
import useAuthStore, { useThemeStore } from './store/authStore';
import useApplicantStore from './store/applicantStore';

function AuthShell({ title, subtitle, children, footerLink, footerText }) {
  const { isDark, toggleTheme } = useThemeStore();
  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-colors ${isDark ? 'dark bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-[radial-gradient(circle_at_top,_#ecfdf5,_#f0fdfa_35%,_#eff6ff_100%)]'}`}>
      <div className={`absolute top-6 right-6 flex gap-2`}>
        <button onClick={toggleTheme} className={`rounded-full px-4 py-2 text-sm font-medium transition z-10 ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-white/40 text-slate-700 hover:bg-white/60 border border-white/20'}`}>
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>
      <div className={`w-full max-w-md overflow-hidden rounded-[28px] border transition-colors ${isDark ? 'dark border-slate-700 bg-slate-800/90' : 'border-emerald-100 bg-white/90'} shadow-[0_25px_60px_rgba(16,185,129,0.15)] backdrop-blur-sm`}>
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-7 text-white">
          <h1 className="text-3xl font-bold">HR Management</h1>
          <p className="mt-1 text-sm text-emerald-50">{subtitle}</p>
        </div>

        <div className="p-8">
          <h2 className={`mb-6 text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h2>
          {children}
          <div className={`mt-5 text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {footerText}{' '}
            <Link to={footerLink} className={`font-semibold ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-emerald-600 hover:text-emerald-700'}`}>{footerLink === '/login' ? 'Login' : 'Sign up'}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Login() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigate = useNavigate();
  const { user, accessToken, setAuth } = useAuthStore();
  const { isDark } = useThemeStore();

  React.useEffect(() => {
    if (accessToken && user) {
      if (user.role === 'HR') {
        navigate('/hr', { replace: true });
      } else if (user.role === 'APPLICANT') {
        navigate('/jobs', { replace: true });
      } else {
        navigate('/employee', { replace: true });
      }
    }
  }, [accessToken, user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) return alert(json.message || 'Login failed');

      setAuth({ accessToken: json.data.accessToken, refreshToken: json.data.refreshToken }, json.data.user);
      const nextPath = json.data.user.role === 'HR' ? '/hr' : (json.data.user.role === 'APPLICANT' ? '/jobs' : '/employee');
      navigate(nextPath, { replace: true });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to access your workspace" footerText="Don't have an account?" footerLink="/signup">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
          <input
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200'}`}
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
          <input
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200'}`}
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-300 transition hover:opacity-95">
          Login
        </button>
      </form>
    </AuthShell>
  );
}

function ApplicantLogin() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigate = useNavigate();
  const { applicantToken, applicant, setApplicant } = useApplicantStore();
  const { isDark } = useThemeStore();

  React.useEffect(() => {
    if (applicantToken && applicant) {
      navigate('/jobs', { replace: true });
    }
  }, [applicantToken, applicant, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/applicant/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) return alert(json.message || 'Login failed');
      setApplicant(json.data.token, json.data.applicant);
      navigate('/jobs', { replace: true });
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <AuthShell title="Applicant Login" subtitle="Sign in to view job opportunities" footerText="Don't have an account?" footerLink="/apply-register">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
          <input
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'}`}
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
          <input
            className={`w-full rounded-xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'}`}
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-300 transition hover:opacity-95">
          Login
        </button>
      </form>
    </AuthShell>
  );
}

function ApplicantRegister() {
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/applicant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) return alert(json.message || 'Registration failed');
      alert('Account created successfully. Please log in.');
      navigate('/apply-login', { replace: true });
    } catch (err) {
      alert(err.message);
    }
  }

  const inputClass = `w-full rounded-xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'}`;
  const labelClass = `mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <AuthShell title="Register as Applicant" subtitle="Create your account and apply for jobs" footerText="Already have an account?" footerLink="/apply-login">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} placeholder="John" required />
          </div>
          <div>
            <label className={labelClass}>Last name</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} placeholder="Doe" required />
          </div>
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" required />
        </div>

        <div>
          <label className={labelClass}>Phone</label>
          <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder="+1 (555) 123-4567" />
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} placeholder="••••••••" required minLength={6} />
        </div>

        <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-300 transition hover:opacity-95">
          Create Account
        </button>
      </form>
    </AuthShell>
  );
}

function SignUp() {
  const [form, setForm] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'EMPLOYEE',
    department: 'Engineering',
    designation: '',
  });
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) return alert(json.message || 'Sign up failed');
      alert('Account created successfully. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      alert(err.message);
    }
  }

  const inputClass = `w-full rounded-xl border px-4 py-3 outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200'}`;
  const labelClass = `mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`;

  return (
    <AuthShell title="Create account" subtitle="Join HR Management and manage your profile" footerText="Already have an account?" footerLink="/login">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>First name</label>
            <input name="firstName" value={form.firstName} onChange={handleChange} className={inputClass} placeholder="John" required />
          </div>
          <div>
            <label className={labelClass}>Last name</label>
            <input name="lastName" value={form.lastName} onChange={handleChange} className={inputClass} placeholder="Doe" required />
          </div>
        </div>

        <div>
          <label className={labelClass}>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClass} placeholder="you@example.com" required />
        </div>

        <div>
          <label className={labelClass}>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className={inputClass} placeholder="••••••••" required minLength={6} />
        </div>

        <div>
          <label className={labelClass}>Role</label>
          <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
            <option value="EMPLOYEE">Employee</option>
            <option value="HR">HR</option>
            <option value="APPLICANT">Applicant (Job Seeker)</option>
          </select>
        </div>

        {form.role !== 'APPLICANT' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Department</label>
                <select name="department" value={form.department} onChange={handleChange} className={inputClass}>
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input name="designation" value={form.designation} onChange={handleChange} className={inputClass} placeholder="Developer" />
              </div>
            </div>
          </>
        )}

        <button type="submit" className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-300 transition hover:opacity-95">
          Sign up
        </button>
      </form>
    </AuthShell>
  );
}

export default function App() {
  const { accessToken, user } = useAuthStore();
  const { isDark, initTheme } = useThemeStore();

  React.useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/apply-login" element={<ApplicantLogin />} />
        <Route path="/apply-register" element={<ApplicantRegister />} />
        <Route path="/jobs" element={<ApplicantProtectedRoute><JobSeekers /></ApplicantProtectedRoute>} />
        <Route path="/employee" element={<ProtectedRoute role={'EMPLOYEE'}><EmployeeDashboard /></ProtectedRoute>} />
        <Route path="/hr" element={<ProtectedRoute role={'HR'}><HRDashboard /></ProtectedRoute>} />
        <Route
          path="/"
          element={
            accessToken && user ? (
              <Navigate to={user.role === 'HR' ? '/hr' : '/employee'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/unauthorized" element={<div className="p-6 text-center text-rose-600">Unauthorized access</div>} />
      </Routes>
    </BrowserRouter>
  );
}
