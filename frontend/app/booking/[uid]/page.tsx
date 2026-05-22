'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { publicApi, bookingsApi } from '@/lib/api';
import { formatDate, formatTime, formatDuration } from '@/lib/utils';

export default function BookingConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = params.uid as string;
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const action = searchParams.get('action');

  useEffect(() => {
    publicApi.getBooking(uid).then(res => {
      if (res.success) setBooking(res.data);
      else setError('Booking not found');
      setLoading(false);
    });
  }, [uid]);

  const handleCancel = async () => {
    setCancelling(true);
    // Find booking by uid in bookings api — use public cancel route
    const res = await fetch(`http://localhost:3001/api/public/booking/${uid}/cancel`, { method: 'POST' });
    const json = await res.json();
    setCancelling(false);
    if (json.success || res.ok) setCancelled(true);
    // Refresh
    const refresh = await publicApi.getBooking(uid);
    if (refresh.success) setBooking(refresh.data);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-auto text-center">
        <div className="text-5xl mb-4">😕</div>
        <h1 className="text-xl font-bold text-slate-900">Booking not found</h1>
        <p className="text-slate-500 mt-2 text-sm">{error}</p>
      </div>
    </div>
  );

  const isCancelled = booking?.status === 'cancelled';
  const isRescheduled = booking?.status === 'rescheduled';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full mx-auto">
        {/* Icon circle */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6${
          isCancelled ? ' bg-red-50' : isRescheduled ? ' bg-blue-50' : ' bg-emerald-50'
        }`}>
          {isCancelled ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : isRescheduled ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/></svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">
          {isCancelled ? 'Booking Cancelled' : isRescheduled ? 'Booking Rescheduled' : "You're Scheduled!"}
        </h1>
        <p className="text-slate-500 text-sm text-center mb-8">
          {isCancelled
            ? 'This meeting has been cancelled.'
            : isRescheduled
            ? 'This booking has been rescheduled to a new time.'
            : `A confirmation email was sent to ${booking?.booker_email}`}
        </p>

        {/* Details section */}
        <div className="space-y-4 bg-slate-50 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Event</div>
              <div className="text-sm font-medium text-slate-800" style={{ color: booking?.color }}>{booking?.event_type_title}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">With</div>
              <div className="text-sm font-medium text-slate-800">{booking?.booker_name} &amp; {booking?.host_name}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Date &amp; Time</div>
              <div className="text-sm font-medium text-slate-800">{formatDate(booking?.start_time)}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {formatTime(booking?.start_time)} – {formatTime(booking?.end_time)} ({formatDuration(booking?.duration)})
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Location</div>
              <div className="text-sm font-medium text-slate-800">{booking?.event_location}</div>
            </div>
          </div>
          {booking?.notes && (
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div className="flex-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Notes</div>
                <div className="text-sm font-medium text-slate-800 font-normal italic">{booking?.notes}</div>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-400 text-center font-mono mt-5">
          Booking ID: {booking?.uid}
        </div>

        {!isCancelled && !isRescheduled && (
          <div className="flex gap-3 mt-8">
            <Link
              href={`/booking/${uid}/reschedule`}
              className="flex-1 py-2.5 text-center border-2 border-slate-200 hover:border-violet-400 text-slate-700 hover:text-violet-600 font-semibold text-sm rounded-xl transition-all"
            >
              Reschedule
            </Link>
            <Link
              href={`/${booking?.username}/${booking?.slug}`}
              className="flex-1 py-2.5 text-center bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Book Again
            </Link>
          </div>
        )}

        {isCancelled && (
          <Link
            href={`/${booking?.username}/${booking?.slug}`}
            className="w-full mt-8 py-2.5 flex items-center justify-center bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Book a New Time
          </Link>
        )}
      </div>
    </div>
  );
}
