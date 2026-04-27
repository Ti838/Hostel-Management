# Software Requirements Specification (SRS)

## DormHQ — Hostel Management System

| Field | Details |
|-------|---------|
| **Document Version** | 2.0 |
| **Date** | April 28, 2026 |
| **Author** | Timon Biswas |
| **Project** | DormHQ — Hostel Management System |
| **Client** | Bangladesh Christian Hostel (BCH) |
| **Repository** | [github.com/Ti838/Hostel-Management](https://github.com/Ti838/Hostel-Management) |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features & Functional Requirements](#3-system-features--functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [System Architecture](#5-system-architecture)
6. [Database Design](#6-database-design)
7. [User Interface Design](#7-user-interface-design)
8. [External Interface Requirements](#8-external-interface-requirements)
9. [Security Requirements](#9-security-requirements)
10. [Glossary](#10-glossary)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the complete software requirements for **DormHQ**, a web-based hostel management system. It is intended for developers, testers, project supervisors, and stakeholders involved in the development and evaluation of the system.

### 1.2 Scope

DormHQ is a single-page application (SPA) that provides comprehensive hostel administration including room management, resident tracking, GPS-based check-in/out, billing with multiple payment methods, meal planning, complaint management, readmission workflows, real-time notifications, and analytics — all with role-based access for Admins and Students.

### 1.3 Definitions, Acronyms & Abbreviations

| Term | Definition |
|------|-----------|
| SPA | Single-Page Application |
| RLS | Row Level Security (Supabase/PostgreSQL) |
| GPS | Global Positioning System |
| CRUD | Create, Read, Update, Delete |
| BDT | Bangladeshi Taka (৳) |
| BCH | Bangladesh Christian Hostel |
| UUID | Universally Unique Identifier |

### 1.4 References

- [React 18 Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Leaflet API Reference](https://leafletjs.com/reference.html)
- [Vite 5 Guide](https://vitejs.dev/guide/)
- IEEE 830-1998 — Recommended Practice for SRS

### 1.5 Overview

The remainder of this document is organized into system description, functional requirements grouped by module, non-functional requirements, architecture, database design, UI specifications, and security considerations.

---

## 2. Overall Description

### 2.1 Product Perspective

DormHQ is a standalone web application that replaces manual paper-based or spreadsheet-based hostel management. It operates as a client-side React SPA communicating with a Supabase PostgreSQL backend via REST and Realtime WebSocket APIs.

### 2.2 Product Functions (High-Level)

1. **Authentication** — Email/password sign-up and sign-in with role assignment
2. **Dashboard** — Real-time overview of occupancy, revenue, complaints, and activity
3. **Room Management** — CRUD operations on rooms with floor, type, and status tracking
4. **Resident Management** — Full resident profiles with search, filter, and status
5. **Check-In/Check-Out** — GPS-tracked entry/exit with reverse geocoding
6. **Billing** — Fee generation, payment recording, receipt printing (PDF)
7. **Meal Planning** — Daily meal schedule management
8. **Complaints** — Categorized complaint filing, priority, and resolution tracking
9. **Readmission** — Workflow for re-enrolling previously checked-out residents
10. **Notifications** — Real-time push notifications for payments, alerts, and info
11. **Reports** — Data export in CSV and PDF formats
12. **Settings** — Full hostel configuration panel
13. **Map Monitor** — Interactive Leaflet map with hostel location and GPS markers

### 2.3 User Classes & Characteristics

| User Class | Description | Privileges |
|------------|-------------|-----------|
| **Admin** | Hostel warden or manager | Full access to all modules, CRUD on all data, settings management |
| **Student** | Hostel resident | View personal dashboard, file complaints, view meals, personal check-in/out |

### 2.4 Operating Environment

- **Client**: Any modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- **Server**: Supabase cloud (PostgreSQL 15+, GoTrue Auth, Realtime)
- **Hosting**: Vercel, Netlify, or any static hosting provider
- **Resolution**: Responsive from 360px (mobile) to 2560px (ultrawide)

### 2.5 Design & Implementation Constraints

- Must work entirely client-side (no custom backend server)
- All data must be stored in Supabase PostgreSQL
- Must support offline-first UI (pages render even without DB connection)
- Must support bilingual interface (English & Bengali)
- Must not require any paid third-party API keys for core functionality

### 2.6 Assumptions & Dependencies

- Users have a stable internet connection for data sync
- Supabase free tier is sufficient for up to 500 residents
- GPS is available on user devices for check-in/out geolocation
- Leaflet/OpenStreetMap tiles are publicly accessible

---

## 3. System Features & Functional Requirements

### 3.1 Authentication Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-AUTH-01 | System shall provide email/password registration | High |
| FR-AUTH-02 | System shall provide email/password login | High |
| FR-AUTH-03 | System shall auto-create a `profiles` row on sign-up via database trigger | High |
| FR-AUTH-04 | Default role shall be `student`; admin promotion via database | High |
| FR-AUTH-05 | System shall persist session across browser refreshes | Medium |
| FR-AUTH-06 | System shall provide sign-out functionality | High |

### 3.2 Dashboard Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-DASH-01 | Admin dashboard shall display: total rooms, active residents, collected revenue, overdue bills | High |
| FR-DASH-02 | Dashboard shall show floor-wise occupancy with progress bars | High |
| FR-DASH-03 | Dashboard shall display interactive hostel map with GPS markers | High |
| FR-DASH-04 | Dashboard shall show pending revenue table with resident names & amounts | Medium |
| FR-DASH-05 | Dashboard shall show recent activity log (check-ins/outs) | Medium |
| FR-DASH-06 | Student dashboard shall show personal room, fees, complaints, and meals | High |
| FR-DASH-07 | Dashboard shall display welcome message if configured | Low |

### 3.3 Room Management Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-ROOM-01 | Admin shall be able to create rooms with: number, floor, type, capacity, rent, amenities | High |
| FR-ROOM-02 | Admin shall be able to edit room details | High |
| FR-ROOM-03 | Admin shall be able to delete rooms | High |
| FR-ROOM-04 | Rooms shall have status: available, occupied, maintenance, reserved | High |
| FR-ROOM-05 | System shall display rooms in a searchable, filterable table | High |
| FR-ROOM-06 | Room types shall include: Single, Double, Triple, Dorm | High |

### 3.4 Resident Management Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-RES-01 | Admin shall create residents with: name, phone, email, NID, DOB, gender, occupation, emergency contacts, address | High |
| FR-RES-02 | Admin shall edit and delete resident records | High |
| FR-RES-03 | Residents shall have status: active, checked_out, pending | High |
| FR-RES-04 | System shall provide search and filter on resident list | High |
| FR-RES-05 | System shall display resident profile cards with key information | Medium |

### 3.5 Check-In / Check-Out Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-CIO-01 | Admin shall perform check-in by selecting resident and room | High |
| FR-CIO-02 | System shall capture GPS coordinates (lat/lng) at check-in | High |
| FR-CIO-03 | System shall reverse-geocode GPS coordinates to address | Medium |
| FR-CIO-04 | Admin shall perform check-out with GPS capture | High |
| FR-CIO-05 | System shall update room status automatically on check-in/out | High |
| FR-CIO-06 | System shall log check-in/out times | High |
| FR-CIO-07 | Check-in/out entries shall appear on the map as GPS markers | Medium |

### 3.6 Billing & Fees Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-BIL-01 | Admin shall create fee records with: type, amount, due date, resident | High |
| FR-BIL-02 | Fee types shall include: monthly_rent, readmission, security_deposit, utility, fine, other | High |
| FR-BIL-03 | Admin shall record payments with method (cash, bKash, Nagad, Rocket, bank, card) | High |
| FR-BIL-04 | System shall auto-generate unique receipt numbers | High |
| FR-BIL-05 | System shall export individual receipts as PDF | High |
| FR-BIL-06 | System shall track statuses: pending, paid, overdue, partial, waived | High |
| FR-BIL-07 | System shall display overdue count on dashboard | Medium |

### 3.7 Meal Planner Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-MEAL-01 | Admin shall create meal entries with: date, type (breakfast/lunch/dinner), menu items | Medium |
| FR-MEAL-02 | Meals shall support special meal flag | Low |
| FR-MEAL-03 | Students shall view upcoming meal schedule | Medium |

### 3.8 Complaints Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-CMP-01 | Students/Admins shall file complaints with: title, description, category, room | High |
| FR-CMP-02 | Categories shall include: maintenance, food, noise, cleanliness, security, electrical, plumbing, other | High |
| FR-CMP-03 | Priorities shall be: low, medium, high, urgent | High |
| FR-CMP-04 | Admin shall update complaint status: open → in_progress → resolved → closed | High |
| FR-CMP-05 | System shall display open complaint count on dashboard | Medium |

### 3.9 Readmission Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-READ-01 | Admin shall create readmission requests for checked-out residents | Medium |
| FR-READ-02 | Readmission shall track: previous room, new room, fee, reason | Medium |
| FR-READ-03 | Status workflow: pending → approved / rejected | Medium |

### 3.10 Notifications Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-NOT-01 | System shall deliver real-time notifications via Supabase Realtime | High |
| FR-NOT-02 | Notification types: info, warning, alert, success, payment | High |
| FR-NOT-03 | Users shall be able to mark notifications as read | Medium |
| FR-NOT-04 | Unread count shall be displayed in sidebar badge and topbar | Medium |

### 3.11 Reports & Analytics Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-RPT-01 | Admin shall export room data as CSV | Medium |
| FR-RPT-02 | Admin shall export resident data as CSV | Medium |
| FR-RPT-03 | Admin shall export fee data as CSV/PDF | Medium |
| FR-RPT-04 | Admin shall export activity logs as CSV | Low |

### 3.12 Settings Module

| ID | Requirement | Priority |
|----|------------|----------|
| FR-SET-01 | Admin shall configure: hostel name, address, phone, email, warden name | High |
| FR-SET-02 | Admin shall configure: base rent, security deposit, late fee, readmission fee, due day | High |
| FR-SET-03 | Admin shall configure: GPS coordinates (lat/lng) for map | Medium |
| FR-SET-04 | Admin shall configure: currency symbol, date format, timezone | Medium |
| FR-SET-05 | Admin shall configure: email templates for welcome, payment, overdue | Low |
| FR-SET-06 | Admin shall configure: enabled modules (meals, complaints, readmission, etc.) | Medium |
| FR-SET-07 | Settings shall persist in `hostel_settings` table | High |

### 3.13 Map Monitor

| ID | Requirement | Priority |
|----|------------|----------|
| FR-MAP-01 | System shall display an interactive Leaflet map centered on hostel coordinates | High |
| FR-MAP-02 | Map shall use dark tiles (CartoDB) for dark themes and light tiles (OSM) for slate theme | Medium |
| FR-MAP-03 | Map shall display hostel marker and check-in/out GPS markers | High |
| FR-MAP-04 | Map shall show today's entry log table below the map | Medium |

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement |
|----|------------|
| NFR-PERF-01 | Initial page load shall complete within 3 seconds on a 4G connection |
| NFR-PERF-02 | Page transitions shall be animated and complete within 300ms |
| NFR-PERF-03 | Dashboard data shall load within 2 seconds from Supabase |

### 4.2 Usability

| ID | Requirement |
|----|------------|
| NFR-USE-01 | UI shall support 5 color themes switchable at runtime |
| NFR-USE-02 | UI shall support bilingual display (English, Bengali) |
| NFR-USE-03 | All interactive elements shall have hover/focus states |
| NFR-USE-04 | Sidebar shall be collapsible for more workspace |
| NFR-USE-05 | Mobile users shall access navigation via hamburger menu overlay |

### 4.3 Reliability

| ID | Requirement |
|----|------------|
| NFR-REL-01 | UI shall remain functional and render pages even if Supabase is unreachable |
| NFR-REL-02 | API errors shall be caught and displayed as user-friendly toast messages |

### 4.4 Security

| ID | Requirement |
|----|------------|
| NFR-SEC-01 | All database tables shall enforce Row Level Security (RLS) |
| NFR-SEC-02 | Students shall only access their own records |
| NFR-SEC-03 | Admin operations shall require authenticated admin role |
| NFR-SEC-04 | API keys shall be stored in environment variables, never committed to git |

### 4.5 Maintainability

| ID | Requirement |
|----|------------|
| NFR-MNT-01 | Codebase shall follow component-based architecture |
| NFR-MNT-02 | All API calls shall be centralized in `lib/supabase.js` |
| NFR-MNT-03 | Design tokens shall be managed via CSS custom properties |
| NFR-MNT-04 | Translations shall be managed via `lib/i18n.js` |

### 4.6 Portability

| ID | Requirement |
|----|------------|
| NFR-PORT-01 | Application shall run on Chrome, Firefox, Safari, Edge (latest 2 versions) |
| NFR-PORT-02 | Application shall be responsive from 360px to 2560px viewport width |
| NFR-PORT-03 | Application shall be deployable to any static hosting provider |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  React   │  │  Framer  │  │ Leaflet  │  │  jsPDF  │ │
│  │  18 SPA  │  │  Motion  │  │   Map    │  │  Export │ │
│  └────┬─────┘  └──────────┘  └──────────┘  └─────────┘ │
│       │                                                  │
│  ┌────┴──────────────────────────────────────────────┐  │
│  │              AppContext (Global State)              │  │
│  │  • Auth  • Theme  • Settings  • Notifications      │  │
│  └────┬──────────────────────────────────────────────┘  │
│       │ REST API + Realtime WebSocket                    │
└───────┼─────────────────────────────────────────────────┘
        │
┌───────┴─────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │PostgreSQL│  │  GoTrue  │  │ Realtime │  │ Storage │ │
│  │  15+     │  │  Auth    │  │WebSocket │  │  (opt)  │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘ │
│                                                          │
│  Row Level Security (RLS) on all tables                  │
└──────────────────────────────────────────────────────────┘
```

---

## 6. Database Design

### 6.1 Entity-Relationship Summary

```
profiles ──── auth.users
    │
    ├── residents (1:1 via resident_id)
    │       │
    │       ├── room_assignments (M:1 resident, M:1 room)
    │       │       └── fees (M:1 assignment)
    │       ├── fees (M:1 resident)
    │       ├── complaints (M:1 resident, M:1 room)
    │       ├── readmissions (M:1 resident)
    │       ├── transportation_bookings (M:1 resident)
    │       └── notifications (M:1 resident)
    │
    rooms ──── room_assignments
    │
    meals (independent)
    hostel_settings (singleton)
    transportation_vehicles ── transportation_routes ── transportation_bookings
```

### 6.2 Table Summary

| Table | Primary Key | Foreign Keys | Row Count Estimate |
|-------|------------|-------------|-------------------|
| `rooms` | UUID | — | 50–200 |
| `residents` | UUID | — | 50–500 |
| `room_assignments` | UUID | resident_id, room_id | 100–2000 |
| `fees` | UUID | resident_id, room_assignment_id | 200–5000 |
| `meals` | UUID | — | 365–1095 |
| `complaints` | UUID | resident_id, room_id | 20–200 |
| `notifications` | UUID | resident_id | 100–5000 |
| `readmissions` | UUID | resident_id, rooms (×2) | 10–100 |
| `hostel_settings` | UUID | — | 1 |
| `profiles` | UUID (FK auth.users) | resident_id | 50–500 |
| `transportation_vehicles` | UUID | — | 5–20 |
| `transportation_routes` | UUID | — | 5–20 |
| `transportation_bookings` | UUID | resident_id, route_id, vehicle_id | 50–1000 |

Complete DDL is in [`supabase_schema.sql`](supabase_schema.sql).

---

## 7. User Interface Design

### 7.1 Layout

- **Sidebar** (fixed left, 240px, collapsible to 56px) — Navigation, user info, theme toggle
- **Topbar** (sticky top) — Page title, date, language switch, notifications, settings
- **Content Area** (scrollable) — Page-specific content with animated transitions

### 7.2 Theme System

5 built-in themes controlled via `data-theme` attribute on `<html>`:

| Theme | Background | Accent | Style |
|-------|-----------|--------|-------|
| Midnight | `#050505` | `#f0a500` Gold | Dark, glassmorphic |
| Slate | `#f8fafc` | `#0f172a` Navy | Light, clean |
| Ocean | `#020b18` | `#06b6d4` Cyan | Deep blue |
| Forest | `#030f07` | `#4ade80` Green | Dark emerald |
| Crimson | `#0f0508` | `#f43f5e` Red | Dark rose |

### 7.3 Design Tokens (CSS Custom Properties)

```css
--bg, --surface, --surface2, --border
--accent, --accent2, --accent-fg
--text, --muted
--green, --red, --blue, --purple
--radius, --sidebar-w, --glow-accent
```

### 7.4 Typography

- **Body**: Outfit (Google Fonts) — weights 300–700
- **Headings**: Space Grotesk (Google Fonts) — weights 500–700

---

## 8. External Interface Requirements

### 8.1 Supabase REST API

- All CRUD operations via `@supabase/supabase-js` client
- Endpoints auto-generated from PostgreSQL schema
- Authentication via GoTrue (JWT tokens)

### 8.2 Supabase Realtime

- WebSocket subscriptions for: notifications, complaints, fees, room_assignments, transportation_bookings
- Used for live notification toasts and unread count updates

### 8.3 Leaflet / OpenStreetMap

- Tile servers: OpenStreetMap (light), CartoDB Dark Matter (dark)
- No API key required
- GPS via browser `navigator.geolocation` API

### 8.4 Browser APIs

- `navigator.geolocation` — GPS for check-in/out
- `localStorage` — Theme, language, and landing page state persistence

---

## 9. Security Requirements

1. **Row Level Security** — All 13 tables have RLS enabled with admin/student policies
2. **Auth Trigger** — Automatic profile creation on sign-up prevents orphan auth users
3. **Environment Variables** — Supabase URL and keys stored in `.env` (gitignored)
4. **HTTPS** — All Supabase communication over HTTPS
5. **Input Validation** — PostgreSQL `CHECK` constraints enforce valid enum values
6. **No Server-Side Code** — Eliminates server-side attack vectors; all security via RLS

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **DormHQ** | The hostel management system described in this document |
| **Supabase** | Open-source Firebase alternative providing PostgreSQL, Auth, Realtime, and Storage |
| **RLS** | Row Level Security — PostgreSQL feature to restrict data access per user |
| **Leaflet** | Open-source JavaScript library for interactive maps |
| **Framer Motion** | React animation library for page transitions and micro-interactions |
| **Glassmorphism** | UI design trend using frosted glass effects with backdrop blur |
| **bKash/Nagad/Rocket** | Popular mobile payment services in Bangladesh |

---

<div align="center">

**DormHQ SRS v2.0** — © 2026 Timon Biswas

</div>
