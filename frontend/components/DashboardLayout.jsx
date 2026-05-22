'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#101010]">
      {/* Sidebar with mobile toggle state */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-neutral-900 bg-[#121212] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#242424] border border-neutral-800/80 flex items-center justify-center text-white text-[10px] font-black tracking-tighter">
              Cal
            </div>
            <span className="text-white font-semibold text-sm">Cal.com</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)} 
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" y1="12" x2="20" y2="12"/>
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="4" y1="18" x2="20" y2="18"/>
            </svg>
          </button>
        </header>

        {/* Content area */}
        <main className="flex-1 lg:ml-60 min-h-screen overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
