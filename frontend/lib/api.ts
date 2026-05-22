const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    return json;
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// ── Event Types ──────────────────────────────────────────────
export const eventTypesApi = {
  list: () => apiRequest('/event-types'),
  get: (id: number) => apiRequest(`/event-types/${id}`),
  create: (data: any) => apiRequest('/event-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => apiRequest(`/event-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/event-types/${id}`, { method: 'DELETE' }),
  toggle: (id: number) => apiRequest(`/event-types/${id}/toggle`, { method: 'PATCH' }),
};

// ── Availability ─────────────────────────────────────────────
export const availabilityApi = {
  get: () => apiRequest('/availability'),
  update: (data: any) => apiRequest('/availability', { method: 'PUT', body: JSON.stringify(data) }),
  create: (data: any) => apiRequest('/availability', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: number) => apiRequest(`/availability/${id}`, { method: 'DELETE' }),
};

// ── Bookings ─────────────────────────────────────────────────
export const bookingsApi = {
  list: (status?: string) => apiRequest(`/bookings${status ? `?status=${status}` : ''}`),
  get: (id: number) => apiRequest(`/bookings/${id}`),
  cancel: (id: number, reason?: string) =>
    apiRequest(`/bookings/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),
};

// ── Public ───────────────────────────────────────────────────
export const publicApi = {
  getEventType: (username: string, slug: string) =>
    apiRequest(`/public/${username}/${slug}`),
  getAvailableDates: (username: string, slug: string, month: string) =>
    apiRequest(`/public/${username}/${slug}/available-dates?month=${month}`),
  getSlots: (username: string, slug: string, date: string, excludeBookingId?: string) =>
    apiRequest(`/public/${username}/${slug}/slots?date=${date}${excludeBookingId ? `&excludeBookingId=${excludeBookingId}` : ''}`),
  book: (username: string, slug: string, data: any) =>
    apiRequest(`/public/${username}/${slug}/book`, { method: 'POST', body: JSON.stringify(data) }),
  getBooking: (uid: string) => apiRequest(`/public/booking/${uid}`),
  reschedule: (uid: string, data: any) =>
    apiRequest(`/public/booking/${uid}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
};
