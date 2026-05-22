'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { formatDate, DAY_NAMES_SHORT } from '@/lib/utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const uid = params.uid;

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [availableDates, setAvailableDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    publicApi.getBooking(uid).then(res => {
      if (res.success) setBooking(res.data);
      else setError('Booking not found');
      setLoading(false);
    });
  }, [uid]);

  useEffect(() => {
    if (!booking) return;
    const month = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    setDatesLoading(true);
    publicApi.getAvailableDates(booking.username, booking.slug, month).then(res => {
      setAvailableDates(res.success ? res.data : []);
      setDatesLoading(false);
    });
  }, [viewDate, booking]);

  useEffect(() => {
    if (!selectedDate || !booking) return;
    setSlotsLoading(true);
    publicApi.getSlots(booking.username, booking.slug, selectedDate, uid).then(res => {
      setSlots(res.success ? res.data : []);
      setSlotsLoading(false);
    });
  }, [selectedDate, booking, uid]);

  const calendarDays = () => {
    const year = viewDate.getFullYear(); const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const getDateStr = (day) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-${String(day).padStart(2, '0')}`;
  };

  const isPast = (day) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    d.setHours(23,59,59);
    return d < today;
  };

  const handleConfirm = async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError('');
    const res = await publicApi.reschedule(uid, { startTime: selectedSlot.start, endTime: selectedSlot.end });
    setSubmitting(false);
    if (res.success) {
      router.push(`/booking/${res.data.uid}`);
    } else {
      setSubmitError(res.error || 'Failed to reschedule');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#101010]">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-neutral-800 border-t-violet-500 rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error || !booking) return (
    <div className="min-h-screen bg-[#101010] flex items-center justify-center p-4">
      <div className="text-center p-10 bg-[#181818] border border-neutral-800/80 rounded-2xl max-w-sm mx-auto shadow-2xl">
        <h2 className="text-xl font-bold text-slate-100 mb-2">Booking not found</h2>
        <p className="text-neutral-400 text-sm">{error}</p>
      </div>
    </div>
  );

  if (booking.status === 'cancelled') return (
    <div className="min-h-screen bg-[#101010] flex items-center justify-center p-4">
      <div className="bg-[#181818] border border-neutral-800/80 rounded-2xl shadow-xl p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-slate-100 mb-2">Cannot Reschedule</h2>
        <p className="text-neutral-400 text-sm mt-2">This booking has been cancelled.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#101010] py-6 sm:py-12 px-4 relative overflow-hidden flex items-center justify-center">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-4xl w-full mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left sidebar */}
          <div className="bg-[#181818] rounded-2xl border border-neutral-800/80 p-5 sm:p-8 h-fit shadow-md text-slate-200">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-bold flex items-center justify-center mb-4 shadow-lg shadow-violet-500/10">
              {booking.host_name?.[0] || 'J'}
            </div>
            <div className="text-sm text-neutral-400 font-medium mb-1">{booking.host_name}</div>
            <h1 className="text-2xl font-bold mb-4 text-slate-100" style={{ color: booking.color }}>{booking.event_type_title}</h1>

            {/* Current booking warning box */}
            <div className="mt-3 p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl">
              <div className="text-xs font-semibold text-amber-400 mb-1">Current Booking</div>
              <div className="text-[13px] text-amber-200">{formatDate(booking.start_time)}</div>
            </div>

            <p className="text-[13px] text-neutral-400 mt-3 leading-relaxed">
              Select a new date and time below to reschedule.
            </p>
          </div>

          {/* Main content */}
          <div className="bg-[#181818] rounded-2xl border border-neutral-800/80 p-4 sm:p-8 shadow-md text-slate-200">
            <h2 className="text-lg font-bold text-slate-100 mb-6">Reschedule — Pick a New Time</h2>

            {submitError && (
              <div className="bg-red-950/20 text-red-400 border border-red-900/30 px-3 py-2.5 rounded-xl mb-4 text-[13px]">
                {submitError}
              </div>
            )}

            {!selectedDate ? (
              <>
                {/* Month navigator */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors disabled:opacity-40"
                    onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}
                    disabled={viewDate <= new Date(today.getFullYear(), today.getMonth(), 1)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span className="text-base sm:text-lg font-bold text-slate-100">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                  <button
                    className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
                    onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAY_NAMES_SHORT.map(d => (
                    <div key={d} className="text-xs font-semibold text-neutral-500 text-center py-2 uppercase">{d}</div>
                  ))}
                  {calendarDays().map((day, i) => {
                    if (!day) return <div key={`e-${i}`} />;
                    const dateStr = getDateStr(day);
                    const isAvail = availableDates.includes(dateStr);
                    const past = isPast(day);
                    const isToday = dateStr === today.toISOString().split('T')[0];
                    if (past) {
                      return (
                        <div key={day} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm text-neutral-700 flex items-center justify-center mx-auto cursor-not-allowed opacity-30">
                          {day}
                        </div>
                      );
                    }
                    if (isAvail) {
                      return (
                        <div
                          key={day}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm font-semibold text-violet-400 bg-violet-950/20 border border-violet-900/30 hover:bg-violet-600 hover:text-white hover:border-transparent transition-colors flex items-center justify-center mx-auto${isToday ? ' ring-2 ring-violet-400' : ''}`}
                          onClick={() => setSelectedDate(dateStr)}
                        >
                          {day}
                        </div>
                      );
                    }
                    return (
                      <div key={day} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl text-xs sm:text-sm text-neutral-600 flex items-center justify-center mx-auto cursor-not-allowed">
                        {day}
                      </div>
                    );
                  })}
                </div>
                {datesLoading && <p className="text-center text-neutral-500 text-[13px] mt-3">Loading availability…</p>}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <button
                    className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
                    onClick={() => { setSelectedDate(null); setSelectedSlot(null); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <span className="font-semibold text-slate-100 text-[15px]">
                    {new Date(selectedDate+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
                  </span>
                </div>
                {slotsLoading ? (
                  <div className="flex flex-col gap-2">
                    {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
                  </div>
                ) : slots.length === 0 ? (
                  <div className="py-6 text-center">
                    <p className="text-neutral-500 text-sm">No available slots on this date.</p>
                    <button
                      className="mt-3 px-4 py-2 text-sm font-semibold bg-[#242424] border border-neutral-800 hover:bg-neutral-800 rounded-xl text-slate-200 transition-colors"
                      onClick={() => setSelectedDate(null)}
                    >
                      Choose another day
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
                      {slots.map(slot => (
                        <button
                          key={slot.start}
                          className={`w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all${
                            selectedSlot?.start === slot.start
                              ? ' border-violet-600 bg-violet-600 text-white'
                              : ' border-violet-900/30 bg-[#1d1d1d] text-violet-400 hover:border-violet-600 hover:bg-violet-600 hover:text-white'
                          }`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          <span>{slot.startTime}</span>
                        </button>
                      ))}
                    </div>
                    {selectedSlot && (
                      <button
                        className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center"
                        onClick={handleConfirm}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : `Confirm Reschedule to ${selectedSlot.startTime}`}
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
