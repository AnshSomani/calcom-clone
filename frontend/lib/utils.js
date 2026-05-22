export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

export function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export function formatDuration(minutes) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h} hour${h > 1 ? 's' : ''}`;
}

export function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function isUpcoming(isoString) {
  return new Date(isoString) > new Date();
}

export function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export const EVENT_COLORS = [
  '#7c3aed', '#0891b2', '#059669', '#dc2626',
  '#d97706', '#2563eb', '#db2777', '#9333ea',
  '#16a34a', '#ea580c', '#0d9488', '#4f46e5',
];

export const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Istanbul', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Singapore', 'Asia/Tokyo', 'Asia/Shanghai', 'Australia/Sydney',
  'Pacific/Auckland',
];

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const label = `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  const value = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  return { label, value };
});

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'confirmed': return 'badge-success';
    case 'cancelled': return 'badge-error';
    case 'pending': return 'badge-warning';
    case 'rescheduled': return 'badge-info';
    default: return 'badge-muted';
  }
}
