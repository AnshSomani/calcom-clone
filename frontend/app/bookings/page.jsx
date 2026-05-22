'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { bookingsApi } from '@/lib/api';
import { formatDate, formatTime, formatDuration } from '@/lib/utils';
import { ToastContainer } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const statusStyles = {
  confirmed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
  pending: 'bg-amber-100 text-amber-700',
  rescheduled: 'bg-blue-100 text-blue-700',
};

export default function BookingsPage() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [counts, setCounts] = useState({ upcoming: 0, past: 0, cancelled: 0 });

  const addToast = useCallback((msg, type = 'success') => {
    setToasts(t => [...t, { id: Date.now().toString(), message: msg, type }]);
  }, []);
  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const fetchBookings = useCallback(async (tab) => {
    setLoading(true);
    const res = await bookingsApi.list(tab);
    if (res.success) setBookings(res.data || []);
    setLoading(false);
  }, []);

  const fetchCounts = useCallback(async () => {
    const [up, past, can] = await Promise.all([
      bookingsApi.list('upcoming'), bookingsApi.list('past'), bookingsApi.list('cancelled'),
    ]);
    setCounts({
      upcoming: up.success ? (up.data || []).length : 0,
      past: past.success ? (past.data || []).length : 0,
      cancelled: can.success ? (can.data || []).length : 0,
    });
  }, []);

  useEffect(() => { fetchBookings(activeTab); }, [activeTab, fetchBookings]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelLoading(true);
    const res = await bookingsApi.cancel(cancelTarget.id, cancelReason);
    setCancelLoading(false);
    if (res.success) {
      addToast('Booking cancelled'); setCancelTarget(null); setCancelReason('');
      fetchBookings(activeTab); fetchCounts();
    } else addToast(res.error || 'Failed to cancel', 'error');
  };

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Bookings</h1>
        <p className="text-slate-500 text-sm mt-1">View and manage all your scheduled meetings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors
              ${activeTab === tab.key ? 'text-violet-600 border-violet-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
            {tab.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold
              ${activeTab === tab.key ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-500'}`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 className="font-semibold text-slate-800 text-lg mb-2">No {activeTab} bookings</h3>
          <p className="text-slate-500 text-sm">
            {activeTab === 'upcoming' ? 'Share your booking link to get meetings scheduled.' : `No ${activeTab} bookings to display.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {bookings.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-4 p-4 fade-in-up">
              {/* Color icon */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: b.color + '20' }}>
                <svg className="w-5 h-5" style={{ color: b.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">{b.booker_name}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs font-medium" style={{ color: b.color }}>{b.event_type_title}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">{b.booker_email}</span>
                  <span className="text-slate-300">·</span>
                  <span className="text-xs text-slate-500">{formatDuration(b.duration)}</span>
                </div>
                {b.notes && <div className="text-xs text-slate-400 mt-1 italic truncate">"{b.notes}"</div>}
              </div>

              {/* Time + actions */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-800">{formatDate(b.start_time)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatTime(b.start_time)} – {formatTime(b.end_time)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyles[b.status] || 'bg-slate-100 text-slate-500'}`}>
                    {b.status}
                  </span>
                  {activeTab === 'upcoming' && (
                    <>
                      <Link href={`/booking/${b.uid}/reschedule`}
                        className="text-xs font-medium px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                        Reschedule
                      </Link>
                      <button onClick={() => setCancelTarget(b)}
                        className="text-xs font-medium px-3 py-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!cancelTarget}
        title="Cancel Booking"
        description={`Cancel the booking with ${cancelTarget?.booker_name}? They will be notified by email.`}
        confirmText="Cancel Booking" cancelText="Keep"
        variant="danger" onConfirm={handleCancel}
        onCancel={() => { setCancelTarget(null); setCancelReason(''); }}
        loading={cancelLoading}
        extraContent={
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason (optional)</label>
            <input className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              placeholder="e.g. Scheduling conflict" value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
        }
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
