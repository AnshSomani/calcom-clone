'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDuration } from '@/lib/utils';

export default function ProfilePage() {
  const [eventTypes, setEventTypes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/api/event-types')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const active = data.data.filter((et: any) => et.is_active);
          setEventTypes(active);
          if (active.length > 0) {
            setUser({ name: active[0].user_name, username: active[0].username });
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50 py-16 px-4">
      <div className="max-w-lg mx-auto">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/70 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Avatar & header */}
            <div className="text-center mb-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-4xl font-bold flex items-center justify-center mx-auto mb-6">
                {user?.name?.[0] || 'J'}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{user?.name || 'John Doe'}</h1>
              <p className="text-slate-500 text-sm">Welcome! Please select a meeting type.</p>
            </div>

            {/* Event type cards */}
            <div className="space-y-3">
              {eventTypes.map(et => (
                <Link
                  key={et.id}
                  href={`/${et.username}/${et.slug}`}
                  className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-sm border border-slate-200/80 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group no-underline"
                >
                  {/* Color bar */}
                  <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ background: et.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors">{et.title}</div>
                    <div className="flex gap-4 text-xs text-slate-500 mt-1">
                      <span>⏱ {formatDuration(et.duration)}</span>
                      <span>📍 {et.location}</span>
                    </div>
                    {et.description && (
                      <div className="text-xs text-slate-400 mt-1 truncate">{et.description}</div>
                    )}
                  </div>
                  {/* Arrow */}
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-violet-400 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center mt-10 text-xs text-slate-400">
              Powered by Cal.com Clone
            </div>
          </>
        )}
      </div>
    </div>
  );
}
