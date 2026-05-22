'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { formatDuration, formatDate, formatTime, DAY_NAMES_SHORT } from '@/lib/utils';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username;
  const slug = params.slug;

  const [user, setUser] = useState(null);
  const [eventType, setEventType] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calendar state
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [datesLoading, setDatesLoading] = useState(false);

  // Slot state
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form state
  const [step, setStep] = useState('calendar');
  const [form, setForm] = useState({ name: '', email: '', notes: '' });
  const [customAnswers, setCustomAnswers] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Load event type
  useEffect(() => {
    publicApi.getEventType(username, slug).then(res => {
      if (res.success) {
        const d = res.data;
        setUser(d.user);
        setEventType(d.eventType);
        setQuestions(d.questions || []);
      } else setError(res.error || 'Event not found');
      setLoading(false);
    });
  }, [username, slug]);

  // Load available dates when month changes
  useEffect(() => {
    if (!eventType) return;
    const month = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    setDatesLoading(true);
    publicApi.getAvailableDates(username, slug, month).then(res => {
      setAvailableDates(res.success ? res.data : []);
      setDatesLoading(false);
    });
  }, [viewDate, eventType, username, slug]);

  // Load slots when date selected
  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSlot(null);
    publicApi.getSlots(username, slug, selectedDate).then(res => {
      setSlots(res.success ? res.data : []);
      setSlotsLoading(false);
    });
  }, [selectedDate, username, slug]);

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const calendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
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
    d.setHours(23, 59, 59);
    return d < today;
  };

  const validateForm = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    questions.filter(q => q.is_required).forEach(q => {
      if (!customAnswers[q.id]?.trim()) e[`q_${q.id}`] = `${q.label} is required`;
    });
    return e;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length) { setFormErrors(errors); return; }
    if (!selectedSlot) return;
    setSubmitting(true);
    const res = await publicApi.book(username, slug, {
      name: form.name, email: form.email, notes: form.notes,
      startTime: selectedSlot.start, endTime: selectedSlot.end,
      customAnswers,
    });
    setSubmitting(false);
    if (res.success) {
      setConfirmedBooking(res.data);
      router.push(`/booking/${res.data.uid}`);
    } else {
      setFormErrors({ submit: res.error || 'Failed to book' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#101010] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-neutral-800 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#101010] flex items-center justify-center">
      <div className="text-center p-10 bg-[#181818] border border-neutral-800/80 rounded-2xl max-w-sm mx-auto shadow-2xl">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold mb-2 text-slate-100">Page not found</h2>
        <p className="text-neutral-400 text-sm">{error}</p>
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
            <div className="w-16 h-16 rounded-full bg-neutral-800 border border-neutral-700/60 text-white text-2xl font-bold flex items-center justify-center mb-4 shadow-2xl">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'AS'}
            </div>
            <div className="text-sm text-neutral-400 font-medium mb-1">{user?.name}</div>
            <h1 className="text-2xl font-bold text-slate-100 mb-6" style={{ color: eventType?.color }}>{eventType?.title}</h1>

            <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {formatDuration(eventType?.duration || 0)}
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {eventType?.location}
            </div>
            {(eventType?.buffer_before || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                {eventType?.buffer_before}min buffer before
              </div>
            )}
            {(eventType?.buffer_after || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-neutral-400 mb-3">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                {eventType?.buffer_after}min buffer after
              </div>
            )}

            {eventType?.description && (
              <p className="text-[13px] text-neutral-400 mt-4 leading-relaxed">
                {eventType.description}
              </p>
            )}

            {/* Selected info */}
            {selectedDate && (
              <div className="mt-6 p-4 bg-[#242424] rounded-xl border border-neutral-800/80">
                <div className="text-xs text-neutral-400 mb-1">Selected Date</div>
                <div className="text-[13px] font-semibold text-slate-200">{formatDate(selectedDate + 'T12:00:00')}</div>
                {selectedSlot && (
                  <div className="text-[13px] text-neutral-400 mt-0.5">{selectedSlot.startTime} – {selectedSlot.endTime}</div>
                )}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="bg-[#181818] rounded-2xl border border-neutral-800/80 p-4 sm:p-8 shadow-md text-slate-200">
            {step === 'calendar' && (
              <div className="animate-in fade-in duration-200">
                {!selectedDate ? (
                  <>
                    <h2 className="text-lg font-bold text-slate-100 mb-6">Select a Date</h2>
                    {/* Month navigator */}
                    <div className="flex items-center justify-between mb-6">
                      <button
                        className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors disabled:opacity-40"
                        onClick={prevMonth}
                        disabled={viewDate <= new Date(today.getFullYear(), today.getMonth(), 1)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <span className="text-base sm:text-lg font-bold text-slate-100">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                      <button className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors" onClick={nextMonth}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {DAY_NAMES_SHORT.map(d => (
                        <div key={d} className="text-xs font-semibold text-neutral-500 text-center py-2 uppercase">{d}</div>
                      ))}
                      {calendarDays().map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} />;
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
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl cursor-pointer text-xs sm:text-sm font-semibold text-white bg-neutral-800/80 border border-neutral-700/50 hover:bg-white hover:text-black hover:border-transparent transition-colors flex items-center justify-center mx-auto${isToday ? ' ring-2 ring-white' : ''}`}
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
                      <h2 className="text-lg font-bold text-slate-100">
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h2>
                    </div>
                    {slotsLoading ? (
                      <div className="flex flex-col gap-2">
                        {[1,2,3,4].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-neutral-500 text-sm">No available slots on this date.</p>
                        <button
                          className="mt-3 px-4 py-2 text-sm font-semibold bg-[#242424] border border-neutral-800 hover:bg-neutral-800 rounded-xl text-slate-200 transition-colors"
                          onClick={() => setSelectedDate(null)}
                        >
                          Choose another day
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {slots.map(slot => (
                          <button
                            key={slot.start}
                            className={`w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-between px-4 ${
                              selectedSlot?.start === slot.start
                                ? 'border-white bg-white text-black'
                                : 'border-neutral-800 bg-[#1d1d1d] text-neutral-300 hover:border-white hover:bg-white hover:text-black'
                            }`}
                            onClick={() => {
                              setSelectedSlot(slot);
                              setTimeout(() => setStep('form'), 300);
                            }}
                          >
                            <span>{slot.startTime}</span>
                            {selectedSlot?.start === slot.start && (
                              <span className="text-xs">Confirm →</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {step === 'form' && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-3 mb-5">
                  <button
                    className="p-2 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors"
                    onClick={() => setStep('calendar')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h2 className="text-lg font-bold text-slate-100">Enter Details</h2>
                </div>

                {formErrors.submit && (
                  <div className="bg-red-950/20 text-red-400 border border-red-900/30 px-3 py-2.5 rounded-xl mb-4 text-[13px]">
                    {formErrors.submit}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Your Name *</label>
                  <input
                    className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white transition-colors ${formErrors.name ? 'border-red-500' : 'border-neutral-800'}`}
                    placeholder="John Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                  {formErrors.name && <span className="text-xs text-red-500 mt-1 block">{formErrors.name}</span>}
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white transition-colors ${formErrors.email ? 'border-red-500' : 'border-neutral-800'}`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                  {formErrors.email && <span className="text-xs text-red-500 mt-1 block">{formErrors.email}</span>}
                </div>

                {/* Custom questions */}
                {questions.map(q => (
                  <div key={q.id} className="mb-4">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">{q.label}{q.is_required ? ' *' : ''}</label>
                    {q.type === 'textarea' ? (
                      <textarea
                        className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white transition-colors resize-none min-h-[80px] ${formErrors[`q_${q.id}`] ? 'border-red-500' : 'border-neutral-800'}`}
                        placeholder={q.placeholder || ''}
                        value={customAnswers[q.id] || ''}
                        onChange={e => setCustomAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      />
                    ) : q.type === 'checkbox' ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={customAnswers[q.id] === 'true'}
                          onChange={e => setCustomAnswers(a => ({ ...a, [q.id]: e.target.checked ? 'true' : 'false' }))}
                          className="w-4 h-4 accent-violet-600"
                        />
                        <span className="text-[13px] text-neutral-400">{q.placeholder || 'Yes'}</span>
                      </label>
                    ) : q.type === 'phone' ? (
                      <input
                        type="tel"
                        className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white transition-colors ${formErrors[`q_${q.id}`] ? 'border-red-500' : 'border-neutral-800'}`}
                        placeholder={q.placeholder || '+1 (555) 000-0000'}
                        value={customAnswers[q.id] || ''}
                        onChange={e => setCustomAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      />
                    ) : (
                      <input
                        className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white transition-colors ${formErrors[`q_${q.id}`] ? 'border-red-500' : 'border-neutral-800'}`}
                        placeholder={q.placeholder || ''}
                        value={customAnswers[q.id] || ''}
                        onChange={e => setCustomAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      />
                    )}
                    {formErrors[`q_${q.id}`] && <span className="text-xs text-red-500 mt-1 block">{formErrors[`q_${q.id}`]}</span>}
                  </div>
                ))}

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">
                    Additional Notes <span className="text-neutral-500 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    className="w-full px-4 py-3 text-sm border border-neutral-800 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white transition-colors resize-none min-h-[80px]"
                    placeholder="Anything you'd like me to know before our meeting..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <button
                  className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl transition-colors text-base disabled:opacity-60 flex items-center justify-center shadow-lg shadow-black/10"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Confirm Booking'}
                </button>
                <p className="text-[11.5px] text-neutral-500 text-center mt-3">
                  A confirmation email will be sent to {form.email || 'your email'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
