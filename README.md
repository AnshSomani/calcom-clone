# Cal.com Clone — Full-Stack Scheduling Application

A fully functional scheduling/booking web application that replicates Cal.com's design and UX. Built with Next.js, Express.js, and PostgreSQL.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | **Next.js 14** (App Router, TypeScript) |
| Backend | **Node.js + Express.js** (REST API) |
| Database | **PostgreSQL** via `pg` (node-postgres) |
| Styling | **Vanilla CSS** (Cal.com-inspired design system) |
| Email | **Nodemailer** (Ethereal test emails by default) |

---

## ✅ Features Implemented

### Core Features
- **Event Types Management** — Create, edit, delete, and toggle event types with title, description, duration, color, and URL slug
- **Availability Settings** — Set weekly availability per day, configure time ranges, choose timezone
- **Public Booking Page** — Calendar view, available time slots, booking form
- **Bookings Dashboard** — Upcoming, past, and cancelled tabs with counts

### Bonus Features
- ✅ **Responsive Design** — Mobile, tablet, desktop (sidebar collapses on mobile)
- ✅ **Multiple Availability Schedules** — Create named schedules (Working Hours, Early Bird, etc.)
- ✅ **Date Overrides** — Block specific dates or set custom hours with optional reasons
- ✅ **Rescheduling Flow** — Full calendar flow to pick a new time; marks original booking as "rescheduled"
- ✅ **Email Notifications** — Confirmation, cancellation, and reschedule emails via Nodemailer (Ethereal test by default, real SMTP configurable)
- ✅ **Buffer Time** — Configurable buffer before and after each meeting
- ✅ **Custom Booking Questions** — Add text, textarea, phone, checkbox questions per event type
- ✅ **Double-Booking Prevention** — Time conflict checks on every booking
- ✅ **Color Picker** — Per-event-type color coding
- ✅ **Requires Confirmation** — Optional "pending" status before host confirms
- ✅ **Cancellation with Reason** — Admin can cancel with an optional reason sent via email

---

## 📁 Project Structure

```
website_copy_assignment/
├── backend/                    # Express.js API
│   ├── src/
│   │   ├── database/
│   │   │   ├── schema.sql      # Full DB schema
│   │   │   ├── seed.js         # Sample data
│   │   │   └── db.js           # PostgreSQL connection pool
│   │   ├── controllers/        # Business logic
│   │   │   ├── eventTypesController.js
│   │   │   ├── availabilityController.js
│   │   │   ├── bookingsController.js
│   │   │   └── publicController.js
│   │   ├── middleware/
│   │   │   └── emailService.js  # Nodemailer emails
│   │   ├── routes/             # Express routers
│   │   └── index.js            # Entry point
│   └── package.json
│
├── frontend/                   # Next.js App
│   ├── app/
│   │   ├── event-types/        # Dashboard: event type management
│   │   ├── availability/       # Dashboard: availability settings
│   │   ├── bookings/           # Dashboard: bookings list
│   │   ├── [username]/[slug]/  # Public booking page
│   │   ├── booking/[uid]/      # Booking confirmation
│   │   ├── booking/[uid]/reschedule/  # Rescheduling flow
│   │   └── john/               # User profile (lists event types)
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Toast.tsx
│   │   └── ConfirmDialog.tsx
│   ├── lib/
│   │   ├── api.ts              # Typed API client
│   │   └── utils.ts            # Helper functions & constants
│   └── package.json
│
└── README.md
```

---

## 🗄️ Database Schema

```
users                    — Admin user (name, username, email, timezone)
event_types              — Meeting types (title, slug, duration, color, buffer times)
booking_questions        — Custom questions per event type
availability             — Named availability schedules (multiple per user)
availability_schedules   — Weekly day/time rules per schedule
date_overrides           — Blocked dates or custom hours
bookings                 — All bookings (uid, status, custom answers, reschedule tracking)
```

> PostgreSQL is used as the primary database. All queries use parameterized `$1, $2...` syntax for security. Schema uses native PostgreSQL types (SERIAL, BOOLEAN, TIMESTAMP).

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js v18+
- npm v9+
- **PostgreSQL 14+** (running locally or remote)

### 1. Clone / Navigate
```bash
cd website_copy_assignment
```

### 2. Create the PostgreSQL Database
```bash
createdb calcom_clone
```
> Or via psql: `CREATE DATABASE calcom_clone;`

### 3. Configure Database Connection
Edit `backend/.env` with your PostgreSQL credentials:
```env
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=calcom_clone
PG_USER=postgres
PG_PASSWORD=postgres
```

### 4. Start the Backend
```bash
cd backend
npm install
npm run dev
```
The API starts at **http://localhost:3001**

> On first run, the schema is created and sample data is seeded automatically.

### 5. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The app starts at **http://localhost:3000**

---

## 🔗 Key URLs

| URL | Description |
|-----|-------------|
| `http://localhost:3000/event-types` | Admin: Event Types Dashboard |
| `http://localhost:3000/availability` | Admin: Availability Settings |
| `http://localhost:3000/bookings` | Admin: Bookings Dashboard |
| `http://localhost:3000/john` | Public: Profile page |
| `http://localhost:3000/john/15min` | Public: Book 15-min call |
| `http://localhost:3000/john/30min` | Public: Book 30-min consultation |
| `http://localhost:3000/john/60min` | Public: Book 60-min session |
| `http://localhost:3001/api/health` | API health check |

---

## 📧 Email Configuration

By default, emails use **Ethereal** (a test SMTP service). Preview URLs are printed in the backend console.

To use real SMTP, set these in `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Cal.com Clone <noreply@yourdomain.com>
```

---

## 🧪 Sample Data

Pre-seeded on first run:
- **User**: John Doe (`john` / `john@example.com`)
- **Event Types**: 15-min Quick Chat, 30-min Consultation (with custom questions), 60-min Strategy Session
- **Availability**: Mon–Fri 9am–5pm (America/New_York) + Early Bird schedule (7am–12pm)
- **Date Overrides**: 1 blocked day, 1 custom-hours day
- **Bookings**: 8 sample bookings (upcoming, past, cancelled)

---

## 🔑 Design Decisions

1. **PostgreSQL**: Production-grade relational database with proper SERIAL auto-increment, native BOOLEAN/TIMESTAMP types, and parameterized queries ($1, $2...) for SQL injection prevention.

2. **No Auth Required**: Per spec, a default admin user (`john`) is assumed logged in. All admin endpoints use this user.

3. **Ethereal Emails**: Allows testing email flows without any SMTP setup. Preview URLs print to console.

4. **Client-Side Rendering for Booking Page**: Ensures real-time slot availability without stale server-side data.

5. **Buffer Time Implementation**: `buffer_before` shifts the available window start; `buffer_after` is added to slot step size, creating gaps between bookable slots.

---

## 📡 API Reference

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/event-types` | List event types |
| POST | `/api/event-types` | Create event type |
| PUT | `/api/event-types/:id` | Update event type |
| DELETE | `/api/event-types/:id` | Delete event type |
| PATCH | `/api/event-types/:id/toggle` | Toggle active/inactive |
| GET | `/api/availability` | Get all availability schedules |
| PUT | `/api/availability` | Update default schedule |
| POST | `/api/availability` | Create new schedule |
| DELETE | `/api/availability/:id` | Delete a schedule |
| GET | `/api/bookings?status=upcoming\|past\|cancelled` | List bookings |
| PUT | `/api/bookings/:id/cancel` | Cancel a booking |

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/:username/:slug` | Get event type info |
| GET | `/api/public/:username/:slug/available-dates?month=` | Available dates |
| GET | `/api/public/:username/:slug/slots?date=` | Available time slots |
| POST | `/api/public/:username/:slug/book` | Create booking |
| GET | `/api/public/booking/:uid` | Get booking by UID |
| POST | `/api/public/booking/:uid/reschedule` | Reschedule booking |
