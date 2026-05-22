'use client';
import { useState, useEffect, useCallback } from 'react';
import { availabilityApi } from '@/lib/api';
import { DAY_NAMES, TIMEZONES, TIME_OPTIONS } from '@/lib/utils';
import { ToastContainer } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const DEFAULT_SCHEDULES = () =>
  Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, start_time: '09:00', end_time: '17:00', is_active: i >= 1 && i <= 5 }));

const inputCls = 'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white transition-colors';

export default function AvailabilityPage() {
  const [availabilities, setAvailabilities] = useState([]);
  const [selected, setSelected] = useState(null);
  const [schedules, setSchedules] = useState(DEFAULT_SCHEDULES());
  const [overrides, setOverrides] = useState([]);
  const [timezone, setTimezone] = useState('America/New_York');
  const [name, setName] = useState('Working Hours');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTimezone, setNewTimezone] = useState('America/New_York');
  const [showAddOverride, setShowAddOverride] = useState(false);
  const [newOverride, setNewOverride] = useState({ date: '', is_blocked: true, start_time: '09:00', end_time: '17:00', reason: '' });

  const addToast = useCallback((msg, type = 'success') => {
    setToasts(t => [...t, { id: Date.now().toString(), message: msg, type }]);
  }, []);
  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const selectAvailability = (av) => {
    setSelected(av); setName(av.name); setTimezone(av.timezone);
    const merged = DEFAULT_SCHEDULES().map(def => av.schedules?.find(s => s.day_of_week === def.day_of_week) || def);
    setSchedules(merged);
    setOverrides(av.overrides || []);
  };

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    const res = await availabilityApi.get();
    if (res.success && res.data?.length > 0) {
      const avs = res.data;
      setAvailabilities(avs);
      selectAvailability(avs.find(a => a.is_default) || avs[0]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAvailability(); }, [fetchAvailability]);

  const handleSave = async () => {
    setSaving(true);
    const res = await availabilityApi.update({ timezone, name, schedules, overrides });
    setSaving(true); // wait, let's keep setSaving(false) like original
    setSaving(false);
    if (res.success) { addToast('Availability saved!'); fetchAvailability(); }
    else addToast(res.error || 'Failed to save', 'error');
  };

  const handleCreateSchedule = async () => {
    if (!newName.trim()) return;
    const res = await availabilityApi.create({ name: newName, timezone: newTimezone, schedules: DEFAULT_SCHEDULES() });
    if (res.success) { addToast('Schedule created!'); setShowNewModal(false); setNewName(''); fetchAvailability(); }
    else addToast(res.error || 'Failed', 'error');
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    const res = await availabilityApi.delete(deleteConfirm.id);
    setDeleteLoading(false);
    if (res.success) { addToast('Schedule deleted'); setDeleteConfirm(null); fetchAvailability(); }
    else addToast(res.error || 'Failed', 'error');
  };

  const addOverride = () => {
    if (!newOverride.date) return;
    const ov = { date: newOverride.date, is_blocked: newOverride.is_blocked, start_time: newOverride.is_blocked ? null : newOverride.start_time, end_time: newOverride.is_blocked ? null : newOverride.end_time, reason: newOverride.reason };
    const existing = overrides.findIndex(o => o.date === newOverride.date);
    setOverrides(o => existing >= 0 ? o.map((item, i) => i === existing ? ov : item) : [...o, ov]);
    setShowAddOverride(false);
    setNewOverride({ date: '', is_blocked: true, start_time: '09:00', end_time: '17:00', reason: '' });
    addToast('Override added. Save to apply.');
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="p-8 max-w-5xl mx-auto fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Availability</h1>
          <p className="text-slate-500 text-sm mt-1">Manage when people can book time with you</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Schedule
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60">
            {saving ? <span className="spinner" /> : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading ? <div className="skeleton h-96 rounded-2xl" /> : (
        <div className={`grid gap-6 ${availabilities.length > 1 ? 'grid-cols-[220px_1fr]' : 'grid-cols-1'}`}>
          {/* Schedule Selector */}
          {availabilities.length > 1 && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Schedules</p>
              {availabilities.map(av => (
                <div key={av.id} onClick={() => selectAvailability(av)}
                  className={`p-3 rounded-xl cursor-pointer mb-2 border transition-all flex items-center justify-between
                    ${selected?.id === av.id ? 'bg-violet-50 border-violet-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{av.name}</div>
                    {av.is_default === 1 && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
                  </div>
                  {!av.is_default && (
                    <button onClick={e => { e.stopPropagation(); setDeleteConfirm(av); }}
                      className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-5">
            {/* Weekly schedule card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Schedule Name</label>
                  <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Timezone</label>
                  <select className={inputCls} value={timezone} onChange={e => setTimezone(e.target.value)}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-5">
                <p className="text-sm font-semibold text-slate-800 mb-1">Weekly Hours</p>
                <p className="text-xs text-slate-500 mb-4">Set your regular availability for each day</p>
                <div className="space-y-2.5">
                  {schedules.map(s => (
                    <div key={s.day_of_week} className="flex items-center gap-4">
                      <label className="toggle-switch flex-shrink-0">
                        <input type="checkbox" checked={!!s.is_active} onChange={() => setSchedules(sc => sc.map(d => d.day_of_week === s.day_of_week ? { ...d, is_active: !d.is_active } : d))} />
                        <span className="toggle-slider" />
                      </label>
                      <span className={`w-24 text-sm font-medium flex-shrink-0 ${s.is_active ? 'text-slate-800' : 'text-slate-400'}`}>
                        {DAY_NAMES[s.day_of_week]}
                      </span>
                      {s.is_active ? (
                        <div className="flex items-center gap-2 flex-1">
                          <select className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white"
                            value={s.start_time} onChange={e => setSchedules(sc => sc.map(d => d.day_of_week === s.day_of_week ? { ...d, start_time: e.target.value } : d))}>
                            {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                          <span className="text-slate-400 text-sm">—</span>
                          <select className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 bg-white"
                            value={s.end_time} onChange={e => setSchedules(sc => sc.map(d => d.day_of_week === s.day_of_week ? { ...d, end_time: e.target.value } : d))}>
                            {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Overrides card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Date Overrides</p>
                  <p className="text-xs text-slate-500 mt-0.5">Block specific dates or set custom hours</p>
                </div>
                <button onClick={() => setShowAddOverride(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Override
                </button>
              </div>

              {showAddOverride && (
                <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Date</label>
                      <input type="date" className={inputCls} min={today} value={newOverride.date} onChange={e => setNewOverride(o => ({ ...o, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Type</label>
                      <select className={inputCls} value={newOverride.is_blocked ? 'blocked' : 'custom'} onChange={e => setNewOverride(o => ({ ...o, is_blocked: e.target.value === 'blocked' }))}>
                        <option value="blocked">Block this day</option>
                        <option value="custom">Custom hours</option>
                      </select>
                    </div>
                  </div>
                  {!newOverride.is_blocked && (
                    <div className="flex items-center gap-2">
                      <select className={`${inputCls} flex-1`} value={newOverride.start_time} onChange={e => setNewOverride(o => ({ ...o, start_time: e.target.value }))}>
                        {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      <span className="text-slate-400 text-sm">—</span>
                      <select className={`${inputCls} flex-1`} value={newOverride.end_time} onChange={e => setNewOverride(o => ({ ...o, end_time: e.target.value }))}>
                        {TIME_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  )}
                  <input className={inputCls} placeholder="Reason (optional)" value={newOverride.reason} onChange={e => setNewOverride(o => ({ ...o, reason: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddOverride(false)} className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors">Cancel</button>
                    <button onClick={addOverride} className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors">Add Override</button>
                  </div>
                </div>
              )}

              {overrides.length === 0 && !showAddOverride ? (
                <p className="text-sm text-slate-400 text-center py-6">No date overrides yet.</p>
              ) : (
                <div className="space-y-2">
                  {overrides.map(ov => (
                    <div key={ov.date} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-800">
                          {new Date(ov.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {ov.is_blocked ? '🚫 Blocked' : `⏰ ${ov.start_time} – ${ov.end_time}`}
                          {ov.reason && ` · ${ov.reason}`}
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${ov.is_blocked ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        {ov.is_blocked ? 'Blocked' : 'Custom'}
                      </span>
                      <button onClick={() => setOverrides(o => o.filter(x => x.date !== ov.date))}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Schedule Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">New Availability Schedule</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg"><svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Name</label>
                <input className={inputCls} placeholder="e.g. Early Bird Hours" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Timezone</label>
                <select className={inputCls} value={newTimezone} onChange={e => setNewTimezone(e.target.value)}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleCreateSchedule} className="px-4 py-2 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteConfirm} title="Delete Schedule" description={`Delete "${deleteConfirm?.name}"? This cannot be undone.`} confirmText="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} loading={deleteLoading} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
