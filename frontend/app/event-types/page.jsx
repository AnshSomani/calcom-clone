'use client';
import { useState, useEffect, useCallback } from 'react';
import { eventTypesApi } from '@/lib/api';
import { EVENT_COLORS, formatDuration } from '@/lib/utils';
import { ToastContainer } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

const DURATIONS = [10, 15, 20, 25, 30, 45, 60, 90, 120];
const LOCATIONS = ['Google Meet', 'Zoom', 'Microsoft Teams', 'Phone Call', 'In-person', 'Custom'];

function EventTypeModal({ eventType, onClose, onSave }) {
  const isEdit = !!eventType;
  const [form, setForm] = useState({
    title: eventType?.title || '', slug: eventType?.slug || '',
    description: eventType?.description || '', duration: eventType?.duration || 30,
    color: eventType?.color || '#7c3aed', location: eventType?.location || 'Google Meet',
    buffer_before: eventType?.buffer_before || 0, buffer_after: eventType?.buffer_after || 0,
    requires_confirmation: !!eventType?.requires_confirmation,
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (isEdit) {
      eventTypesApi.get(eventType.id).then(r => {
        if (r.success && r.data?.questions) setQuestions(r.data.questions);
      });
    }
  }, [isEdit, eventType]);

  const autoSlug = (title) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleTitleChange = (title) =>
    setForm(f => ({ ...f, title, ...(isEdit ? {} : { slug: autoSlug(title) }) }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.slug.trim()) e.slug = 'URL slug is required';
    if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Slug must be lowercase letters, numbers and hyphens only';
    if (!form.duration) e.duration = 'Duration is required';
    return e;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const res = isEdit
      ? await eventTypesApi.update(eventType.id, { ...form, questions })
      : await eventTypesApi.create({ ...form, questions });
    setLoading(false);
    if (res.success) { onSave(); onClose(); }
    else setErrors({ submit: res.error || 'Failed to save' });
  };

  const addQuestion = () => setQuestions(q => [...q, { label: '', type: 'text', placeholder: '', is_required: false }]);
  const removeQuestion = (i) => setQuestions(q => q.filter((_, idx) => idx !== i));
  const updateQuestion = (i, field, value) =>
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const inputCls = (err) =>
    `w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors bg-white
     ${err ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100' : 'border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100'}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">{isEdit ? 'Edit Event Type' : 'New Event Type'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 border-b border-slate-100">
          {['general', 'questions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize -mb-px border-b-2
                ${activeTab === tab ? 'text-violet-600 border-violet-600' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
              {tab === 'general' ? 'General' : `Custom Questions (${questions.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'general' && (
            <>
              {errors.submit && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">{errors.submit}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Title *</label>
                <input className={inputCls(errors.title)} placeholder="e.g. 30 Min Meeting"
                  value={form.title} onChange={e => handleTitleChange(e.target.value)} />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">URL Slug *</label>
                <div className="flex border border-slate-200 rounded-lg overflow-hidden focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100">
                  <span className="bg-slate-50 text-slate-400 text-sm px-3 py-2 border-r border-slate-200 whitespace-nowrap">cal.com/john/</span>
                  <input className="flex-1 px-3 py-2 text-sm outline-none bg-white"
                    value={form.slug} placeholder="30min"
                    onChange={e => setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
                </div>
                {errors.slug && <p className="text-red-500 text-xs mt-1">{errors.slug}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea className={inputCls()} rows={3} placeholder="Brief description..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Duration *</label>
                  <select className={inputCls(errors.duration)} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: +e.target.value }))}>
                    {DURATIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">Location</label>
                  <select className={inputCls()} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
                    {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {['buffer_before', 'buffer_after'].map(field => (
                  <div key={field}>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                      Buffer {field === 'buffer_before' ? 'Before' : 'After'} (min)
                    </label>
                    <select className={inputCls()} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: +e.target.value }))}>
                      {[0, 5, 10, 15, 20, 30].map(v => <option key={v} value={v}>{v === 0 ? 'None' : `${v} min`}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">Color</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      style={{ background: c }}
                      className={`w-7 h-7 rounded-full transition-transform hover:scale-110 ${form.color === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`} />
                  ))}
                </div>
              </div>
              <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                <input type="checkbox" checked={form.requires_confirmation}
                  onChange={e => setForm(f => ({ ...f, requires_confirmation: e.target.checked }))}
                  className="mt-0.5 accent-violet-600" />
                <div>
                  <div className="text-sm font-medium text-slate-800">Requires Confirmation</div>
                  <div className="text-xs text-slate-500 mt-0.5">Booking will be in "pending" state until you manually confirm it</div>
                </div>
              </label>
            </>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">Add custom questions that bookers must answer when scheduling.</p>
              {questions.map((q, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Question {i + 1}</span>
                    <button onClick={() => removeQuestion(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                  </div>
                  <div className="flex gap-2">
                    <input className={`${inputCls()} flex-1`} placeholder="Question label"
                      value={q.label} onChange={e => updateQuestion(i, 'label', e.target.value)} />
                    <select className={`${inputCls()} w-32`} value={q.type} onChange={e => updateQuestion(i, 'type', e.target.value)}>
                      <option value="text">Short text</option>
                      <option value="textarea">Long text</option>
                      <option value="phone">Phone</option>
                      <option value="select">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                  <input className={inputCls()} placeholder="Placeholder text (optional)"
                    value={q.placeholder} onChange={e => updateQuestion(i, 'placeholder', e.target.value)} />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={q.is_required}
                      onChange={e => updateQuestion(i, 'is_required', e.target.checked)}
                      className="accent-violet-600" />
                    <span className="text-xs text-slate-600">Required</span>
                  </label>
                </div>
              ))}
              <button onClick={addQuestion}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Question
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={loading}
            className="px-5 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60">
            {loading ? <span className="spinner" /> : (isEdit ? 'Save Changes' : 'Create Event Type')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventTypesPage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingET, setEditingET] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts(t => [...t, { id, message, type }]);
  }, []);
  const removeToast = useCallback((id) => setToasts(t => t.filter(x => x.id !== id)), []);

  const fetchEventTypes = useCallback(async () => {
    setLoading(true);
    const res = await eventTypesApi.list();
    if (res.success) setEventTypes(res.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchEventTypes(); }, [fetchEventTypes]);

  const handleToggle = async (et) => {
    await eventTypesApi.toggle(et.id);
    fetchEventTypes();
    addToast(`${et.title} ${et.is_active ? 'disabled' : 'enabled'}`);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    const res = await eventTypesApi.delete(deleteConfirm.id);
    setDeleteLoading(false);
    if (res.success) { addToast('Event type deleted'); setDeleteConfirm(null); fetchEventTypes(); }
    else addToast(res.error || 'Failed to delete', 'error');
  };

  const copyLink = (et) => {
    navigator.clipboard.writeText(`${window.location.origin}/${et.username}/${et.slug}`);
    setCopiedId(et.id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast('Link copied!');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Event Types</h1>
          <p className="text-slate-500 text-sm mt-1">Manage the events people can book with you</p>
        </div>
        <button onClick={() => { setEditingET(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Event Type
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : eventTypes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <h3 className="font-semibold text-slate-800 text-lg mb-2">No event types yet</h3>
          <p className="text-slate-500 text-sm mb-6">Create your first event type to start accepting bookings.</p>
          <button onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors">
            Create Event Type
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {eventTypes.map(et => (
            <div key={et.id}
              className={`bg-white rounded-xl border border-slate-200 flex items-center overflow-hidden shadow-sm hover:shadow-md transition-all fade-in-up ${!et.is_active ? 'opacity-60' : ''}`}>
              {/* Color bar */}
              <div className="w-1.5 self-stretch flex-shrink-0" style={{ background: et.color }} />

              {/* Info */}
              <div className="flex-1 px-5 py-4 min-w-0">
                <div className="font-semibold text-slate-900 text-sm">{et.title}</div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {formatDuration(et.duration)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    {et.location}
                  </span>
                  {(et.question_count || 0) > 0 && (
                    <span className="text-xs text-slate-500">{et.question_count} question{et.question_count !== 1 ? 's' : ''}</span>
                  )}
                  {(et.buffer_after || 0) > 0 && (
                    <span className="text-xs text-slate-500">+{et.buffer_after}min buffer</span>
                  )}
                </div>
                <div className="text-xs text-violet-500 mt-1 font-mono">/{et.username}/{et.slug}</div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pr-4">
                {/* Toggle */}
                <label className="toggle-switch mx-1" title={et.is_active ? 'Disable' : 'Enable'}>
                  <input type="checkbox" checked={!!et.is_active} onChange={() => handleToggle(et)} />
                  <span className="toggle-slider" />
                </label>

                {/* Copy link */}
                <div className="relative">
                  <button onClick={() => copyLink(et)}
                    title="Copy link"
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
                    {copiedId === et.id
                      ? <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      : <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    }
                  </button>
                  {copiedId === et.id && <div className="copy-tooltip">Copied!</div>}
                </div>

                {/* Edit */}
                <button onClick={() => { setEditingET(et); setModalOpen(true); }} title="Edit"
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>

                {/* Delete */}
                <button onClick={() => setDeleteConfirm(et)} title="Delete"
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <EventTypeModal
          eventType={editingET}
          onClose={() => { setModalOpen(false); setEditingET(null); }}
          onSave={() => { fetchEventTypes(); addToast(editingET ? 'Event type updated!' : 'Event type created!'); }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Delete Event Type"
        description={`Are you sure you want to delete "${deleteConfirm?.title}"? All associated bookings will also be deleted.`}
        confirmText="Delete" variant="danger"
        onConfirm={handleDelete} onCancel={() => setDeleteConfirm(null)} loading={deleteLoading}
      />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
