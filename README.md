# Cal.com Clone — Full-Stack Scheduling Application

A fully functional scheduling/booking web application that replicates Cal.com's modern design and premium UX. Built with Next.js, Express.js, Tailwind CSS v4, and PostgreSQL.

---

## 🚀 Tech Stack

| Layer | Technology | Status / Details |
|---|---|---|
| **Frontend** | **Next.js 16** (App Router) | Migrated to **pure JavaScript/JSX** (Zero TypeScript) |
| **Styling** | **Tailwind CSS v4** | Modern utility-first design system with micro-animations & sleek dark modes |
| **Backend** | **Node.js + Express.js** | Lightweight REST API (pure CommonJS JavaScript) |
| **Database** | **PostgreSQL** via `pg` | Connected via connection pool. Supports cloud providers with SSL (Neon/Railway) and local environments. |
| **Email** | **Nodemailer** | Event notifications (Ethereal test accounts by default, real SMTP configurable) |

---

## ✅ Features Implemented

### Core Features
- **Event Types Management** — Create, edit, delete, and toggle event types with title, description, duration, color, and URL slug.
- **Availability Settings** — Set weekly availability per day, configure time ranges, and select timezones.
- **Public Booking Page** — Dynamic interactive calendar, date selection, available slots calculation, and custom booking forms.
- **Bookings Dashboard** — Manage upcoming, past, and cancelled appointments with automatic tab counts.

### Advanced & Bonus Features
- ✅ **Responsive Design** — Fully optimized for mobile, tablet, and desktop viewports (sidebar collapses dynamically).
- ✅ **Multiple Availability Schedules** — Create named schedules (e.g., Working Hours, Early Bird) with active toggle states.
- ✅ **Date Overrides** — Easily block specific dates or configure custom working hours per date.
- ✅ **Rescheduling Flow** — Interactive rescheduling calendars; automatically flags original bookings as "rescheduled" and creates new link references.
- ✅ **Email Notifications** — Automatically dispatches beautifully formatted confirmation, cancellation, and reschedule emails.
- ✅ **Buffer Time** — Configurable padding before and after slots to prevent consecutive back-to-back conflicts.
- ✅ **Custom Booking Questions** — Define text, paragraph, phone, or checkbox questions that adapt dynamically onto public checkout forms.
- ✅ **Double-Booking Prevention** — Built-in scheduling conflicts algorithm to prevent double-booking.

---

## 📁 Project Structure

```
website_copy_assignment/
├── backend/                    # Express.js API
│   ├── src/
│   │   ├── database/
│   │   │   ├── schema.sql      # Full PostgreSQL database schema
│   │   │   ├── seed.js         # Auto-seeding script with full demo content
│   │   │   └── db.js           # Database client supporting SSL for Neon/Railway
│   │   ├── controllers/        # Express request controllers
│   │   ├── middleware/
│   │   │   └── emailService.js # Nodemailer dispatcher
│   │   ├── routes/             # REST router definitions
│   │   └── index.js            # Express server entrypoint
│   └── package.json
│
├── frontend/                   # Next.js App (Pure JS / Tailwind CSS v4)
│   ├── app/
│   │   ├── event-types/        # Admin: Event Types Dashboard
│   │   ├── availability/       # Admin: Availability Settings
│   │   ├── bookings/           # Admin: Bookings Dashboard
│   │   ├── [username]/[slug]/  # Public: Interactive Booking Page
│   │   ├── booking/[uid]/      # Public: Confirmation page with cancel/reschedule
│   │   ├── booking/[uid]/reschedule/  # Public: Interactive Rescheduling calendar
│   │   └── john/               # Public: Host landing profile
│   ├── components/
│   │   ├── Sidebar.jsx         # Navigation layout
│   │   ├── Toast.jsx           # Push notification feedback
│   │   └── ConfirmDialog.jsx   # Context confirm modals
│   ├── lib/
│   │   ├── api.js              # Centralized API requests layer
│   │   └── utils.js            # Date formatting, duration parsing, and styling helper utilities
│   ├── jsconfig.json           # Path alias settings (@/* map to ./*)
│   └── package.json            # Configured as type: module
│
└── README.md
```

---

## 🗄️ Database Schema

The relational database is constructed in PostgreSQL for performance and integrity. All SQL statements utilize parameterized queries to defend against SQL injections.

```
users                    — Hosts metadata (name, username, email, timezone)
event_types              — Productized templates (title, slug, duration, color, buffer times)
booking_questions        — Custom forms per event type
availability             — Host-defined weekly schedule templates
availability_schedules   — Days and times configured inside a weekly schedule
date_overrides           — Locked dates or custom-timed exceptions
bookings                 — Scheduled slots (status, answer payloads, reschedule records)
```

---

## 🛠️ Setup Instructions

### Prerequisites
- Node.js v20+
- npm v10+
- **PostgreSQL 14+** (Local server or Cloud connection via Neon)

### 1. Configure the Environment
Inside `backend/.env`, provide your PostgreSQL connection details.
* **For Cloud databases (Neon / Railway)**:
  ```env
  DATABASE_URL=postgresql://user:password@host.neon.tech/neondb?sslmode=require
  ```
* **For Local databases**:
  ```env
  PG_HOST=localhost
  PG_PORT=5432
  PG_DATABASE=calcom_clone
  PG_USER=postgres
  PG_PASSWORD=your_password
  ```

### 2. Start the Backend API
```bash
cd backend
npm install
npm run dev
```
The REST API spins up at **http://localhost:3001**.
* *Note: On first startup, the application auto-creates all database tables and seeds demo profiles automatically.*

### 3. Start the Next.js Frontend
```bash
cd ../frontend
npm install
npm run dev
```
The client interface runs at **http://localhost:3000**.

---

## 🔗 Key URLs

| URL | Description |
|---|---|
| `http://localhost:3000/event-types` | Host: Admin Event Types |
| `http://localhost:3000/availability` | Host: Weekly Schedules & Overrides |
| `http://localhost:3000/bookings` | Host: Bookings Dashboard (Upcoming / Past / Cancelled) |
| `http://localhost:3000/john` | Public: Landing Profile for Host John |
| `http://localhost:3000/john/30min` | Public: 30-Minute Consultation Booking Calendar |
| `http://localhost:3001/api/health` | Backend: API Health Check |

---

## 📧 Email Configuration

By default, the backend utilizes **Ethereal Email** (a test SMTP service). Real-time test-email sandbox links are printed to the backend terminal logs upon actions.

To swap to live delivery (e.g., Gmail SMTP), specify in `backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_address@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=Cal.com Clone <noreply@yourdomain.com>
```
