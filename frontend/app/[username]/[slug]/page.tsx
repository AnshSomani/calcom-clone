'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { publicApi } from '@/lib/api';
import { formatDuration, formatDate, formatTime, DAY_NAMES_SHORT } from '@/lib/utils';

interface EventType { id: number; title: string; description: string; duration: number; color: string; location: string; buffer_before: number; buffer_after: number; slug: string; }
interface User { name: string; username: string; bio: string; }
interface Question { id: number; label: string; type: string; placeholder: string; is_required: number; options?: string; }
interface TimeSlot { start: string; end: string; startTime: string; endTime: string; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const slug = params.slug as string;

  const [user, setUser] = useState<User | null>(null);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Calendar state
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [datesLoading, setDatesLoading] = useState(false);

  // Slot state
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form state
  const [step, setStep] = useState<'calendar' | 'form' | 'confirmed'>('calendar');
  const [form, setForm] = useState({ name: '', email: '', notes: '' });
  const [customAnswers, setCustomAnswers] = useState<Record<number, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Load event type
  useEffect(() => {
    publicApi.getEventType(username, slug).then(res => {
      if (res.success) {
        const d = res.data as any;
        setUser(d.user);
        setEventType(d.eventType);
        setQuestions(d.questions || []);
      } else setError((res as any).error || 'Event not found');
      setLoading(false);
    });
  }, [username, slug]);

  // Load available dates when month changes
  useEffect(() => {
    if (!eventType) return;
    const month = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}`;
    setDatesLoading(true);
    publicApi.getAvailableDates(username, slug, month).then(res => {
      setAvailableDates(res.success ? (res.data as string[]) : []);
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
      setSlots(res.success ? (res.data as TimeSlot[]) : []);
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
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    while (days.length % 7 !== 0) days.push(null);
    return days;
  };

  const getDateStr = (day: number) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-${String(day).padStart(2, '0')}`;
  };

  const isPast = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    d.setHours(23, 59, 59);
    return d < today;
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
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
      router.push(`/booking/${(res.data as any).uid}`);
    } else {
      setFormErrors({ submit: (res as any).error || 'Failed to book' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50">
      <div className="text-center p-10">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold mb-2">Page not found</h2>
        <p className="text-slate-500">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Left sidebar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 h-fit">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-bold flex items-center justify-center mb-4">
              {user?.name?.[0] || 'J'}
            </div>
            <div className="text-sm text-slate-500 font-medium mb-1">{user?.name}</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-6" style={{ color: eventType?.color }}>{eventType?.title}</h1>

            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {formatDuration(eventType?.duration || 0)}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {eventType?.location}
            </div>
            {(eventType?.buffer_before || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                {eventType?.buffer_before}min buffer before
              </div>
            )}
            {(eventType?.buffer_after || 0) > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                {eventType?.buffer_after}min buffer after
              </div>
            )}

            {eventType?.description && (
              <p className="text-[13px] text-slate-500 mt-4 leading-relaxed">
                {eventType.description}
              </p>
            )}

            {/* Selected info */}
            {selectedDate && (
              <div className="mt-6 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <div className="text-xs text-slate-500 mb-1">Selected</div>
                <div className="text-[13px] font-semibold text-slate-900">{formatDate(selectedDate + 'T12:00:00')}</div>
                {selectedSlot && (
                  <div className="text-[13px] text-slate-500 mt-0.5">{selectedSlot.startTime} – {selectedSlot.endTime}</div>
                )}
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {step === 'calendar' && (
              <div className="animate-in fade-in duration-200">
                {!selectedDate ? (
                  <>
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Select a Date</h2>
                    {/* Month navigator */}
                    <div className="flex items-center justify-between mb-6">
                      <button
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-40"
                        onClick={prevMonth}
                        disabled={viewDate <= new Date(today.getFullYear(), today.getMonth(), 1)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <span className="text-lg font-bold text-slate-900">{MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                      <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors" onClick={nextMonth}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {DAY_NAMES_SHORT.map(d => (
                        <div key={d} className="text-xs font-semibold text-slate-400 text-center py-2 uppercase">{d}</div>
                      ))}
                      {calendarDays().map((day, i) => {
                        if (!day) return <div key={`empty-${i}`} />;
                        const dateStr = getDateStr(day);
                        const isAvail = availableDates.includes(dateStr);
                        const past = isPast(day);
                        const isToday = dateStr === today.toISOString().split('T')[0];
                        if (past) {
                          return (
                            <div key={day} className="w-10 h-10 rounded-xl text-sm text-slate-300 flex items-center justify-center mx-auto cursor-not-allowed opacity-30">
                              {day}
                            </div>
                          );
                        }
                        if (isAvail) {
                          return (
                            <div
                              key={day}
                              className={`w-10 h-10 rounded-xl cursor-pointer text-sm font-semibold text-violet-700 bg-violet-50 hover:bg-violet-600 hover:text-white transition-colors flex items-center justify-center mx-auto${isToday ? ' ring-2 ring-violet-400' : ''}`}
                              onClick={() => setSelectedDate(dateStr)}
                            >
                              {day}
                            </div>
                          );
                        }
                        return (
                          <div key={day} className="w-10 h-10 rounded-xl text-sm text-slate-300 flex items-center justify-center mx-auto cursor-not-allowed">
                            {day}
                          </div>
                        );
                      })}
                    </div>
                    {datesLoading && <p className="text-center text-slate-400 text-[13px] mt-3">Loading availability…</p>}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-5">
                      <button
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        onClick={() => { setSelectedDate(null); setSelectedSlot(null); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                      </button>
                      <h2 className="text-lg font-bold text-slate-900">
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </h2>
                    </div>
                    {slotsLoading ? (
                      <div className="flex flex-col gap-2">
                        {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-lg bg-slate-100 animate-pulse" />)}
                      </div>
                    ) : slots.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-slate-400 text-sm">No available slots on this date.</p>
                        <button
                          className="mt-3 px-4 py-2 text-sm font-semibold border-2 border-slate-200 rounded-xl text-slate-600 hover:border-violet-300 transition-colors"
                          onClick={() => setSelectedDate(null)}
                        >
                          Choose another day
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {slots.map(slot => (
                          <button
                            key={slot.start}
                            className={`w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all flex items-center justify-between px-4${
                              selectedSlot?.start === slot.start
                                ? ' border-violet-600 bg-violet-600 text-white'
                                : ' border-violet-200 text-violet-700 hover:border-violet-600 hover:bg-violet-600 hover:text-white'
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
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    onClick={() => setStep('calendar')}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
                  </button>
                  <h2 className="text-lg font-bold text-slate-900">Enter Details</h2>
                </div>

                {formErrors.submit && (
                  <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl mb-4 text-[13px]">
                    {formErrors.submit}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Your Name *</label>
                  <input
                    className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white transition-colors${formErrors.name ? ' border-red-400' : ' border-slate-200'}`}
                    placeholder="John Smith"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  />
                  {formErrors.name && <span className="text-xs text-red-500 mt-1 block">{formErrors.name}</span>}
                </div>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white transition-colors${formErrors.email ? ' border-red-400' : ' border-slate-200'}`}
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  />
                  {formErrors.email && <span className="text-xs text-red-500 mt-1 block">{formErrors.email}</span>}
                </div>

                {/* Custom questions */}
                {questions.map(q => (
                  <div key={q.id} className="mb-4">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">{q.label}{q.is_required ? ' *' : ''}</label>
                    {q.type === 'textarea' ? (
                      <textarea
                        className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white transition-colors resize-none min-h-[80px]${formErrors[`q_${q.id}`] ? ' border-red-400' : ' border-slate-200'}`}
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
                        <span className="text-[13px] text-slate-700">{q.placeholder || 'Yes'}</span>
                      </label>
                    ) : q.type === 'phone' ? (
                      <input
                        type="tel"
                        className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white transition-colors${formErrors[`q_${q.id}`] ? ' border-red-400' : ' border-slate-200'}`}
                        placeholder={q.placeholder || '+1 (555) 000-0000'}
                        value={customAnswers[q.id] || ''}
                        onChange={e => setCustomAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      />
                    ) : (
                      <input
                        className={`w-full px-4 py-3 text-sm border rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white transition-colors${formErrors[`q_${q.id}`] ? ' border-red-400' : ' border-slate-200'}`}
                        placeholder={q.placeholder || ''}
                        value={customAnswers[q.id] || ''}
                        onChange={e => setCustomAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                      />
                    )}
                    {formErrors[`q_${q.id}`] && <span className="text-xs text-red-500 mt-1 block">{formErrors[`q_${q.id}`]}</span>}
                  </div>
                ))}

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Additional Notes <span className="text-slate-400 font-normal normal-case">(optional)</span>
                  </label>
                  <textarea
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white transition-colors resize-none min-h-[80px]"
                    placeholder="Anything you'd like me to know before our meeting..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <button
                  className="w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors text-base disabled:opacity-60 flex items-center justify-center"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Confirm Booking'}
                </button>
                <p className="text-[11.5px] text-slate-400 text-center mt-3">
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
