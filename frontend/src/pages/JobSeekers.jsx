import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useThemeStore } from '../store/authStore';
import useApplicantStore from '../store/applicantStore';
import { getJobs } from '../api/api';

export default function JobSeekers() {
  const { isDark, toggleTheme } = useThemeStore();
  const { applicant, logout } = useApplicantStore();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [form, setForm] = useState({ name: applicant?.firstName + ' ' + applicant?.lastName || '', email: applicant?.email || '', phone: applicant?.phone || '', message: '' });
  const [appliedJobs, setAppliedJobs] = useState(new Set());

  useEffect(() => {
    async function fetchJobs() {
      try {
        const res = await getJobs();
        if (res.success) {
          setJobs(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch jobs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const parseRequirements = (reqString) => {
    if (!reqString) return [];
    try {
      return typeof reqString === 'string' ? JSON.parse(reqString) : [];
    } catch {
      return [];
    }
  };

  function handleLogout() {
    logout();
    navigate('/apply-login', { replace: true });
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleApply(jobId) {
    if (!form.name || !form.email || !form.phone) {
      alert('Please fill in all fields');
      return;
    }
    setAppliedJobs(prev => new Set(prev).add(jobId));
    setForm({ name: '', email: '', phone: '', message: '' });
    alert('Application submitted successfully!');
    setSelectedJob(null);
  }

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'dark bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-blue-50 via-white to-cyan-50'} p-6`}>
      <div className={`mx-auto max-w-6xl`}>
        {/* Header */}
        <div className={`mb-8 rounded-3xl border transition-colors ${isDark ? 'dark border-slate-700 bg-slate-800/90' : 'border-blue-100 bg-white/90'} p-8 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Job Opportunities</h1>
              <p className={`mt-2 text-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Welcome, {applicant?.firstName} {applicant?.lastName}</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={toggleTheme} className={`rounded-full px-4 py-2 text-sm font-medium transition ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>
                {isDark ? '☀️ Light' : '🌙 Dark'}
              </button>
              <button onClick={handleLogout} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500">
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Job Listings */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Available Positions</h2>
            {loading ? (
              <div className={`rounded-2xl border-2 p-8 text-center ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white/50'}`}>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Loading job opportunities...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className={`rounded-2xl border-2 p-8 text-center ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white/50'}`}>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>No open positions available at the moment.</p>
              </div>
            ) : (
              jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all ${
                    selectedJob?.id === job.id
                      ? isDark
                        ? 'dark border-blue-500 bg-slate-700/50'
                        : 'border-blue-500 bg-blue-50/50'
                      : isDark
                      ? 'dark border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      : 'border-slate-200 bg-white/50 hover:border-slate-300'
                  } ${appliedJobs.has(job.id) ? (isDark ? 'ring-2 ring-emerald-500/50' : 'ring-2 ring-emerald-400/50') : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{job.title}</h3>
                        {appliedJobs.has(job.id) && <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-semibold text-emerald-600">Applied ✓</span>}
                      </div>
                      <p className={`mt-1 text-sm font-medium ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{job.department}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm">
                        {job.location && <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>📍 {job.location}</span>}
                        {job.salary && <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{job.salary}</span>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>📅 Posted: {formatDate(job.datePosted)}</span>
                        <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>⏰ Closes: {formatDate(job.closingDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Application Form */}
          <div className="space-y-4">
            {selectedJob ? (
              <div className={`rounded-2xl border transition-colors ${isDark ? 'dark border-slate-700 bg-slate-800/90' : 'border-blue-100 bg-white/90'} p-6 shadow-lg`}>
                <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Apply for Position</h3>
                
                <div className={`mb-4 rounded-xl p-3 ${isDark ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>{selectedJob.title}</p>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{selectedJob.department}</p>
                </div>

                <div className={`mb-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} pt-3`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Requirements</p>
                  <ul className="space-y-1">
                    {parseRequirements(selectedJob.requirements).map((req, idx) => (
                      <li key={idx} className={`text-sm flex gap-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span>✓</span> {req}
                      </li>
                    ))}
                  </ul>
                </div>

                <p className={`mb-4 text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{selectedJob.description}</p>

                <form className="space-y-3">
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Cover Letter</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Tell us why you're interested in this position..."
                      rows={3}
                      className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${isDark ? 'border-slate-600 bg-slate-700 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200'}`}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleApply(selectedJob.id)}
                    disabled={appliedJobs.has(selectedJob.id)}
                    className={`w-full rounded-xl px-4 py-2 font-semibold transition ${appliedJobs.has(selectedJob.id) ? (isDark ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-200 text-slate-500 cursor-not-allowed') : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:opacity-95'}`}
                  >
                    {appliedJobs.has(selectedJob.id) ? 'Already Applied ✓' : 'Submit Application'}
                  </button>
                </form>
              </div>
            ) : (
              <div className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${isDark ? 'dark border-slate-600 bg-slate-800/50' : 'border-slate-200 bg-slate-50/50'}`}>
                <p className={`text-lg font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  Select a job to view details and apply
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
