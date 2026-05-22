'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { bookingsApi } from '@/lib/api';
import { formatDate, formatTime, formatDuration } from '@/lib/utils';
import { ToastContainer } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const statusStyles = {
  confirmed: 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30',
  cancelled: 'bg-red-950/30 text-red-400 border border-red-900/30',
  pending: 'bg-amber-950/30 text-amber-400 border border-amber-900/30',
  rescheduled: 'bg-blue-950/30 text-blue-400 border border-blue-900/30',
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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100">Bookings</h1>
        <p className="text-neutral-400 text-sm mt-1">View and manage all your scheduled meetings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-800/80 mb-6 overflow-x-auto scrollbar-none whitespace-nowrap">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors flex-shrink-0
              ${activeTab === tab.key ? 'text-violet-400 border-violet-400' : 'text-neutral-400 border-transparent hover:text-white'}`}>
            {tab.label}
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border
              ${activeTab === tab.key ? 'bg-violet-950/40 text-violet-300 border-violet-900/40' : 'bg-[#242424] text-neutral-400 border-neutral-800'}`}>
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
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-[#181818] border border-neutral-800 rounded-2xl">
          <div className="w-16 h-16 bg-[#242424] border border-neutral-800 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <h3 className="font-bold text-slate-200 text-lg mb-2">No {activeTab} bookings</h3>
          <p className="text-neutral-400 text-sm">
            {activeTab === 'upcoming' ? 'Share your booking link to get meetings scheduled.' : `No ${activeTab} bookings to display.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map(b => (
            <div key={b.id} className="bg-[#181818] rounded-xl border border-neutral-800/80 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center gap-4 p-4 fade-in-up">
              {/* Left Side: Color Icon + Booker details */}
              <div className="flex items-start gap-3 w-full min-w-0">
                {/* Color icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0" style={{ background: b.color + '20' }}>
                  <svg className="w-5 h-5" style={{ color: b.color }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-100 text-sm truncate">{b.booker_name}</div>
                  <div className="flex items-center gap-x-2 gap-y-1 mt-1 flex-wrap">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border" style={{ color: b.color, borderColor: b.color + '30', background: b.color + '10' }}>{b.event_type_title}</span>
                    <span className="text-xs text-neutral-400 truncate max-w-[150px] sm:max-w-xs">{b.booker_email}</span>
                    <span className="text-neutral-600 hidden sm:inline">·</span>
                    <span className="text-xs text-neutral-400">{formatDuration(b.duration)}</span>
                  </div>
                  {b.notes && (
                    <div className="text-xs text-neutral-500 mt-2 italic bg-neutral-900/40 p-2.5 rounded-lg border border-neutral-800/60 max-w-xl break-words">
                      "{b.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Time + actions */}
              <div className="flex flex-col md:items-end gap-3 border-t border-neutral-800/60 pt-3 md:border-0 md:pt-0 flex-shrink-0 w-full md:w-auto">
                <div className="md:text-right flex flex-row md:flex-col justify-between items-center md:items-end w-full gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{formatDate(b.start_time)}</div>
                    <div className="text-xs text-neutral-400 mt-0.5">{formatTime(b.start_time)} – {formatTime(b.end_time)}</div>
                  </div>
                  <span className={`md:hidden text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusStyles[b.status] || 'bg-[#242424] text-neutral-400 border-neutral-800'}`}>
                    {b.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 justify-end w-full md:w-auto">
                  <span className={`hidden md:inline-block text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${statusStyles[b.status] || 'bg-[#242424] text-neutral-400 border-neutral-800'}`}>
                    {b.status}
                  </span>
                  {activeTab === 'upcoming' && (
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <Link href={`/booking/${b.uid}/reschedule`}
                        className="flex-1 md:flex-none text-center text-xs font-medium px-3 py-1.5 bg-[#242424] hover:bg-neutral-800 text-slate-200 rounded-lg border border-neutral-800 transition-colors">
                        Reschedule
                      </Link>
                      <button onClick={() => setCancelTarget(b)}
                        className="flex-1 md:flex-none text-center text-xs font-medium px-3 py-1.5 text-red-400 hover:bg-red-950/30 rounded-lg transition-colors border border-red-900/20 md:border-0">
                        Cancel
                      </button>
                    </div>
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
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Reason (optional)</label>
            <input className="w-full px-3 py-2 text-sm border border-neutral-800 rounded-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white"
              placeholder="e.g. Scheduling conflict" value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
        }
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
