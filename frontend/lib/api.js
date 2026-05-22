const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiRequest(endpoint, options = {}) {
  try {
    // Sanitize base URL and endpoint to prevent double-slashes or missing slashes
    const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${cleanBase}${cleanEndpoint}`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || `HTTP ${res.status}`);
    }
    return json;
  } catch (err) {
    return { success: false, error: err.message || 'Network error' };
  }
}

// ── Event Types ──────────────────────────────────────────────
export const eventTypesApi = {
  list: () => apiRequest('/event-types'),
  get: (id) => apiRequest(`/event-types/${id}`),
  create: (data) => apiRequest('/event-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/event-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/event-types/${id}`, { method: 'DELETE' }),
  toggle: (id) => apiRequest(`/event-types/${id}/toggle`, { method: 'PATCH' }),
};

// ── Availability ─────────────────────────────────────────────
export const availabilityApi = {
  get: () => apiRequest('/availability'),
  update: (data) => apiRequest('/availability', { method: 'PUT', body: JSON.stringify(data) }),
  create: (data) => apiRequest('/availability', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/availability/${id}`, { method: 'DELETE' }),
};

// ── Bookings ─────────────────────────────────────────────────
export const bookingsApi = {
  list: (status) => apiRequest(`/bookings${status ? `?status=${status}` : ''}`),
  get: (id) => apiRequest(`/bookings/${id}`),
  cancel: (id, reason) =>
    apiRequest(`/bookings/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),
};

// ── Public ───────────────────────────────────────────────────
export const publicApi = {
  getEventType: (username, slug) =>
    apiRequest(`/public/${username}/${slug}`),
  getAvailableDates: (username, slug, month) =>
    apiRequest(`/public/${username}/${slug}/available-dates?month=${month}`),
  getSlots: (username, slug, date, excludeBookingId) =>
    apiRequest(`/public/${username}/${slug}/slots?date=${date}${excludeBookingId ? `&excludeBookingId=${excludeBookingId}` : ''}`),
  book: (username, slug, data) =>
    apiRequest(`/public/${username}/${slug}/book`, { method: 'POST', body: JSON.stringify(data) }),
  getBooking: (uid) => apiRequest(`/public/booking/${uid}`),
  reschedule: (uid, data) =>
    apiRequest(`/public/booking/${uid}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),
};
