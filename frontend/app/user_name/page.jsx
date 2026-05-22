'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDuration } from '@/lib/utils';

export default function ProfilePage() {
  const [eventTypes, setEventTypes] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const cleanBase = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    fetch(`${cleanBase}/event-types`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const active = data.data.filter((et) => et.is_active);
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
    <div className="min-h-screen bg-[#101010] py-16 px-4 relative overflow-hidden flex items-center justify-center">
      {/* Premium background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-lg w-full mx-auto relative z-10">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : (
          <>
            {/* Avatar & header */}
            <div className="text-center mb-10">
              <div className="w-24 h-24 rounded-full bg-neutral-800 text-white text-4xl font-bold flex items-center justify-center mx-auto mb-6 shadow-2xl">
                {user?.name?.[0] || 'A'}
              </div>
              <h1 className="text-2xl font-bold text-slate-100 mb-2">{user?.name || 'Ansh Somani'}</h1>
              <p className="text-neutral-400 text-sm">Welcome! Please select a meeting type.</p>
            </div>

            {/* Event type cards */}
            <div className="space-y-3">
              {eventTypes.map(et => (
                <Link
                  key={et.id}
                  href={`/${et.username}/${et.slug}`}
                  className="bg-[#181818] rounded-2xl p-5 flex items-center gap-4 border border-neutral-800/80 hover:border-neutral-700/80 hover:shadow-xl hover:shadow-black/25 transition-all cursor-pointer group no-underline"
                >
                  {/* Color bar */}
                  <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ background: et.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-200 group-hover:text-white transition-colors">{et.title}</div>
                    <div className="flex gap-4 text-xs text-neutral-400 mt-1.5">
                      <span>⏱ {formatDuration(et.duration)}</span>
                      <span>📍 {et.location}</span>
                    </div>
                    {et.description && (
                      <div className="text-xs text-neutral-500 mt-1 truncate">{et.description}</div>
                    )}
                  </div>
                  {/* Arrow */}
                  <svg className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              ))}
            </div>

            {/* Footer */}
            <div className="text-center mt-12 text-xs text-neutral-600">
              Powered by Cal.com
            </div>
          </>
        )}
      </div>
    </div>
  );
}
