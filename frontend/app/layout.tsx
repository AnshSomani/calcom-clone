import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cal.com Clone — Scheduling App',
  description: 'A powerful scheduling and booking application. Create event types, set your availability, and let others book time with you.',
  keywords: 'scheduling, booking, calendar, meetings, appointments',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
