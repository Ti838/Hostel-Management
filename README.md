# 🏠 BCH v2 — Bangladesh Christian Hostel Management System
**React + Supabase · No fake data · PDF Receipts · Google Maps · CSV Import**

---

## ✨ What's New in v2

| Feature | Description |
|---|---|
| **Zero fake data** | Starts completely empty — all data is real, from your Supabase DB |
| **PDF Receipts** | Generate + download + print PDF receipts on every payment |
| **On-screen Receipt** | View receipt preview before printing |
| **Google Maps** | Hostel location on map + GPS-tagged check-in/out log |
| **OpenStreetMap fallback** | Works without Google API key using OpenStreetMap embed |
| **CSV Import** | Bulk import rooms and residents from spreadsheet |
| **CSV Templates** | Download templates with correct column format |
| **Realtime** | Live notifications via Supabase realtime |
| **5 Themes** | Midnight, Slate, Ocean, Forest, Crimson |
| **GPS capture** | Auto-captures lat/lng on check-in and check-out |

---

## 🚀 Deploy in 10 minutes

### Step 1 — Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **Anon Key** (Settings → API)

### Step 2 — Run the Schema
1. In Supabase: **SQL Editor → New Query**
2. Paste entire contents of `supabase_schema.sql`
3. Click **Run All**
4. ✅ Tables created, realtime enabled, settings row inserted

### Step 3 — Configure Environment
```bash
cp .env.example .env
```
Edit `.env`:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4 — Run Locally
```bash
npm install
npm run dev
# Open http://localhost:5173
```

### Step 5 — Deploy to Vercel
```bash
# Option A: CLI
npm install -g vercel
vercel deploy
# Enter env vars when prompted

# Option B: Dashboard
# Push to GitHub → vercel.com → Import → Add env vars → Deploy
```

### Step 6 (Optional) — Google Maps
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps JavaScript API**
3. Create an API key
4. In BCH: **Settings → Map & Location → Google Maps API Key**

---

## 📋 Data Flow

```
Admin adds rooms → Admin adds residents → Check In (GPS captured) →
Generate fees → Mark paid → Download PDF receipt → Check Out (GPS captured)
```

**All data lives in your Supabase PostgreSQL database.**

---

## 📁 Project Structure
```
src/
├── components/
│   ├── MapMonitor.jsx     # Google Maps + OpenStreetMap + GPS log
│   └── ui.jsx             # Shared UI components
├── context/
│   └── AppContext.jsx     # Global state, themes, settings, realtime
├── lib/
│   ├── supabase.js        # All API functions
│   ├── receiptPdf.js      # jsPDF receipt generator
│   └── csvImport.js       # PapaParse CSV utilities + templates
├── pages/
│   ├── Dashboard.jsx      # Stats + map monitor
│   ├── Rooms.jsx          # Room grid + CSV import
│   ├── Residents.jsx      # Resident management + CSV import
│   ├── CheckInOut.jsx     # GPS check-in/out + history
│   ├── Billing.jsx        # Fees + PDF receipts
│   └── OtherPages.jsx     # Meals, Complaints, Notifications, Readmission, Reports, Settings
├── App.jsx
├── main.jsx
└── index.css
supabase_schema.sql        # Full DB schema with realtime
```

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `rooms` | Room inventory (number, floor, type, rent, status) |
| `residents` | Resident profiles with emergency contacts |
| `room_assignments` | Check-in/out log with GPS coordinates |
| `fees` | All fees with receipt numbers |
| `meals` | Weekly meal planner |
| `complaints` | Issue tracker |
| `notifications` | Broadcast notices |
| `readmissions` | Re-entry requests |
| `hostel_settings` | Single settings row (name, location, fees, API keys) |

---

## 📊 Receipt Format

PDF receipts include:
- Hostel header (name, address, phone)
- Receipt number (auto-generated)
- Resident name, phone, room
- Fee type and description
- Amount breakdown
- Payment method + transaction reference
- PAID stamp in green
- Computer-generated footer

---

## 📍 GPS / Map Features

- **Check-in**: Browser asks for location → lat/lng stored in `room_assignments.in_lat/in_lng`
- **Check-out**: Same for out coordinates
- **Map**: Shows hostel location as gold marker
- **Log table**: All today's check-ins/outs with coordinates
- **Without API key**: OpenStreetMap iframe (free, no key needed)
- **With Google API key**: Full styled Google Maps with custom markers
