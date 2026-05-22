'use client';
import { useState, useEffect, useCallback } from 'react';
import { availabilityApi } from '@/lib/api';
import { DAY_NAMES, TIMEZONES, TIME_OPTIONS } from '@/lib/utils';
import { ToastContainer } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const DEFAULT_SCHEDULES = () =>
  Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, start_time: '09:00', end_time: '17:00', is_active: i >= 1 && i <= 5 }));

const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-800 rounded-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white transition-colors';

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
    <div className="p-4 sm:p-8 max-w-5xl mx-auto fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Availability</h1>
          <p className="text-neutral-400 text-sm mt-1">Manage when people can book time with you</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setShowNewModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#181818] border border-neutral-800 text-slate-200 text-sm font-medium rounded-xl hover:bg-neutral-800 transition-colors shadow-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Schedule
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-neutral-200 text-black text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-60">
            {saving ? <span className="spinner" /> : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading ? <div className="skeleton h-96 rounded-2xl" /> : (
        <div className={`grid gap-6 ${availabilities.length > 1 ? 'grid-cols-1 md:grid-cols-[220px_1fr]' : 'grid-cols-1'}`}>
          {/* Schedule Selector */}
          {availabilities.length > 1 && (
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Schedules</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 mb-4 md:mb-0">
                {availabilities.map(av => (
                  <div key={av.id} onClick={() => selectAvailability(av)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between
                      ${selected?.id === av.id ? 'bg-neutral-800/80 border-neutral-700' : 'bg-[#181818] border-neutral-800/80 hover:border-neutral-700'}`}>
                    <div>
                      <div className="text-sm font-semibold text-slate-200">{av.name}</div>
                      {av.is_default === 1 && <span className="text-xs bg-[#242424] text-neutral-400 border border-neutral-800 px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
                    </div>
                    {!av.is_default && (
                      <button onClick={e => { e.stopPropagation(); setDeleteConfirm(av); }}
                        className="p-1 hover:bg-red-950/30 rounded-lg text-neutral-400 hover:text-red-400 transition-colors">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Weekly schedule card */}
            <div className="bg-[#181818] rounded-2xl border border-neutral-800/80 shadow-sm p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Schedule Name</label>
                  <input className={inputCls} value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Timezone</label>
                  <select className={inputCls} value={timezone} onChange={e => setTimezone(e.target.value)}>
                    {TIMEZONES.map(tz => <option key={tz} value={tz} className="bg-[#1d1d1d] text-white">{tz}</option>)}
                  </select>
                </div>
              </div>
              <div className="border-t border-neutral-800/80 pt-5">
                <p className="text-sm font-semibold text-slate-200 mb-1">Weekly Hours</p>
                <p className="text-xs text-neutral-500 mb-4">Set your regular availability for each day</p>
                <div className="space-y-3">
                  {schedules.map(s => (
                    <div key={s.day_of_week} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#242424]/40 border border-neutral-800/40 sm:bg-transparent sm:border-0 sm:p-0 gap-3">
                      <div className="flex items-center gap-3">
                        <label className="toggle-switch flex-shrink-0">
                          <input type="checkbox" checked={!!s.is_active} onChange={() => setSchedules(sc => sc.map(d => d.day_of_week === s.day_of_week ? { ...d, is_active: !d.is_active } : d))} />
                          <span className="toggle-slider" />
                        </label>
                        <span className={`w-24 text-sm font-medium flex-shrink-0 ${s.is_active ? 'text-slate-200' : 'text-neutral-500'}`}>
                          {DAY_NAMES[s.day_of_week]}
                        </span>
                      </div>
                      {s.is_active ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-xs ml-8 sm:ml-0">
                          <select className="flex-1 px-3 py-1.5 text-sm border border-neutral-800 rounded-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white"
                            value={s.start_time} onChange={e => setSchedules(sc => sc.map(d => d.day_of_week === s.day_of_week ? { ...d, start_time: e.target.value } : d))}>
                            {TIME_OPTIONS.map(t => <option key={t.value} value={t.value} className="bg-[#1d1d1d] text-white">{t.label}</option>)}
                          </select>
                          <span className="text-neutral-500 text-sm">—</span>
                          <select className="flex-1 px-3 py-1.5 text-sm border border-neutral-800 rounded-lg outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-950/40 bg-[#1d1d1d] text-white"
                            value={s.end_time} onChange={e => setSchedules(sc => sc.map(d => d.day_of_week === s.day_of_week ? { ...d, end_time: e.target.value } : d))}>
                            {TIME_OPTIONS.map(t => <option key={t.value} value={t.value} className="bg-[#1d1d1d] text-white">{t.label}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-500 italic ml-8 sm:ml-0">Unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Date Overrides card */}
            <div className="bg-[#181818] rounded-2xl border border-neutral-800/80 shadow-sm p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Date Overrides</p>
                  <p className="text-xs text-neutral-500 mt-0.5">Block specific dates or set custom hours</p>
                </div>
                <button onClick={() => setShowAddOverride(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[#242424] hover:bg-neutral-800 text-slate-200 rounded-lg border border-neutral-800 transition-colors w-full sm:w-auto">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Override
                </button>
              </div>

              {showAddOverride && (
                <div className="bg-[#242424] border border-neutral-800/60 rounded-xl p-4 mb-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Date</label>
                      <input type="date" className={inputCls} min={today} value={newOverride.date} onChange={e => setNewOverride(o => ({ ...o, date: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-400 mb-1">Type</label>
                      <select className={inputCls} value={newOverride.is_blocked ? 'blocked' : 'custom'} onChange={e => setNewOverride(o => ({ ...o, is_blocked: e.target.value === 'blocked' }))}>
                        <option value="blocked" className="bg-[#1d1d1d] text-white">Block this day</option>
                        <option value="custom" className="bg-[#1d1d1d] text-white">Custom hours</option>
                      </select>
                    </div>
                  </div>
                  {!newOverride.is_blocked && (
                    <div className="flex items-center gap-2">
                      <select className={`${inputCls} flex-1`} value={newOverride.start_time} onChange={e => setNewOverride(o => ({ ...o, start_time: e.target.value }))}>
                        {TIME_OPTIONS.map(t => <option key={t.value} value={t.value} className="bg-[#1d1d1d] text-white">{t.label}</option>)}
                      </select>
                      <span className="text-neutral-500 text-sm">—</span>
                      <select className={`${inputCls} flex-1`} value={newOverride.end_time} onChange={e => setNewOverride(o => ({ ...o, end_time: e.target.value }))}>
                        {TIME_OPTIONS.map(t => <option key={t.value} value={t.value} className="bg-[#1d1d1d] text-white">{t.label}</option>)}
                      </select>
                    </div>
                  )}
                  <input className={inputCls} placeholder="Reason (optional)" value={newOverride.reason} onChange={e => setNewOverride(o => ({ ...o, reason: e.target.value }))} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowAddOverride(false)} className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#181818] hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-colors">Cancel</button>
                    <button onClick={addOverride} className="px-3 py-1.5 text-xs font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors">Add Override</button>
                  </div>
                </div>
              )}

              {overrides.length === 0 && !showAddOverride ? (
                <p className="text-sm text-neutral-500 text-center py-6">No date overrides yet.</p>
              ) : (
                <div className="space-y-2">
                  {overrides.map(ov => (
                    <div key={ov.date} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-[#242424] border border-neutral-800/60 rounded-xl justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">
                          {new Date(ov.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5 truncate">
                          {ov.is_blocked ? '🚫 Blocked' : `⏰ ${ov.start_time} – ${ov.end_time}`}
                          {ov.reason && ` · ${ov.reason}`}
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 justify-end w-full sm:w-auto">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full border ${ov.is_blocked ? 'bg-red-950/30 text-red-400 border-red-900/30' : 'bg-blue-950/30 text-blue-400 border-blue-900/30'}`}>
                          {ov.is_blocked ? 'Blocked' : 'Custom'}
                        </span>
                        <button onClick={() => setOverrides(o => o.filter(x => x.date !== ov.date))}
                          className="p-1.5 hover:bg-red-950/30 rounded-lg text-neutral-400 hover:text-red-400 transition-colors">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false); }}>
          <div className="bg-[#181818] border border-neutral-800/80 rounded-2xl shadow-2xl w-full max-w-sm text-slate-100 animate-in fade-in-up duration-200">
            <div className="flex items-center justify-between p-6 border-b border-neutral-800/80">
              <h2 className="text-base font-semibold text-slate-100">New Availability Schedule</h2>
              <button onClick={() => setShowNewModal(false)} className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white"><svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Name</label>
                <input className={inputCls} placeholder="e.g. Early Bird Hours" value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1.5">Timezone</label>
                <select className={inputCls} value={newTimezone} onChange={e => setNewTimezone(e.target.value)}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz} className="bg-[#1d1d1d] text-white">{tz}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-800/80">
              <button onClick={() => setShowNewModal(false)} className="px-4 py-2 text-sm font-medium text-slate-300 bg-[#242424] hover:bg-neutral-800 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleCreateSchedule} className="px-4 py-2 text-sm font-semibold text-black bg-white hover:bg-neutral-200 rounded-lg transition-colors">Create</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteConfirm} title="Delete Schedule" description={`Delete "${deleteConfirm?.name}"? This cannot be undone.`} confirmText="Delete" variant="danger" onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} loading={deleteLoading} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
