-- ================================================================
-- DormHQ v2 — Production Supabase Schema
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run All
-- ================================================================

create extension if not exists "uuid-ossp";

-- ── ROOMS ────────────────────────────────────────────────────────
create table if not exists rooms (
  id            uuid primary key default uuid_generate_v4(),
  room_number   text not null unique,
  floor         integer not null,
  type          text not null check (type in ('Single','Double','Triple','Dorm')),
  capacity      integer not null default 1,
  monthly_rent  numeric not null default 5000,
  status        text not null default 'available'
                  check (status in ('available','occupied','maintenance','reserved')),
  amenities     text[] default '{}',
  description   text,
  created_at    timestamptz default now()
);

-- ── RESIDENTS ────────────────────────────────────────────────────
create table if not exists residents (
  id                  uuid primary key default uuid_generate_v4(),
  full_name           text not null,
  phone               text not null,
  email               text,
  nid                 text,
  date_of_birth       date,
  gender              text check (gender in ('Male','Female','Other')),
  occupation          text,
  emergency_contact   text,
  emergency_phone     text,
  address             text,
  photo_url           text,
  status              text not null default 'active'
                        check (status in ('active','checked_out','pending')),
  created_at          timestamptz default now()
);

-- ── ROOM ASSIGNMENTS (check-in/out log) ──────────────────────────
create table if not exists room_assignments (
  id                  uuid primary key default uuid_generate_v4(),
  resident_id         uuid references residents(id) on delete cascade,
  room_id             uuid references rooms(id) on delete cascade,
  check_in_date       date not null,
  expected_checkout   date,
  actual_checkout     timestamptz,
  in_time             time not null default '12:00:00',
  out_time            time,
  in_lat              numeric,   -- GPS latitude at check-in
  in_lng              numeric,   -- GPS longitude at check-in
  out_lat             numeric,   -- GPS latitude at check-out
  out_lng             numeric,   -- GPS longitude at check-out
  in_address          text,      -- Reverse-geocoded address at check-in
  out_address         text,
  status              text default 'active'
                        check (status in ('active','completed','readmission')),
  notes               text,
  created_at          timestamptz default now()
);

-- ── FEES ─────────────────────────────────────────────────────────
create table if not exists fees (
  id                  uuid primary key default uuid_generate_v4(),
  resident_id         uuid references residents(id) on delete cascade,
  room_assignment_id  uuid references room_assignments(id),
  fee_type            text not null
                        check (fee_type in ('monthly_rent','readmission','security_deposit','utility','fine','other')),
  description         text,
  amount              numeric not null,
  due_date            date not null,
  paid_date           date,
  paid_amount         numeric default 0,
  payment_method      text check (payment_method in ('cash','bkash','nagad','rocket','bank','card')),
  transaction_ref     text,
  status              text default 'pending'
                        check (status in ('pending','paid','overdue','partial','waived')),
  receipt_number      text unique default ('RCP-' || to_char(now(),'YYYYMMDD') || '-' || substr(uuid_generate_v4()::text,1,6)),
  note                text,
  created_at          timestamptz default now()
);

-- ── MEALS ────────────────────────────────────────────────────────
create table if not exists meals (
  id          uuid primary key default uuid_generate_v4(),
  meal_date   date not null,
  meal_type   text not null check (meal_type in ('breakfast','lunch','dinner')),
  menu_items  text[] not null default '{}',
  description text,
  is_special  boolean default false,
  created_at  timestamptz default now(),
  unique(meal_date, meal_type)
);

-- ── COMPLAINTS ───────────────────────────────────────────────────
create table if not exists complaints (
  id            uuid primary key default uuid_generate_v4(),
  resident_id   uuid references residents(id) on delete set null,
  room_id       uuid references rooms(id),
  title         text not null,
  description   text not null,
  category      text not null
                  check (category in ('maintenance','food','noise','cleanliness','security','electrical','plumbing','other')),
  priority      text default 'medium'
                  check (priority in ('low','medium','high','urgent')),
  status        text default 'open'
                  check (status in ('open','in_progress','resolved','closed')),
  assigned_to   text,
  resolved_at   timestamptz,
  created_at    timestamptz default now()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────────
create table if not exists notifications (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  body        text not null,
  type        text default 'info'
                check (type in ('info','warning','alert','success','payment')),
  target      text default 'all'
                check (target in ('all','resident','admin')),
  resident_id uuid references residents(id) on delete cascade,
  is_read     boolean default false,
  created_at  timestamptz default now()
);

-- ── READMISSIONS ─────────────────────────────────────────────────
create table if not exists readmissions (
  id                  uuid primary key default uuid_generate_v4(),
  resident_id         uuid references residents(id) on delete cascade,
  previous_room_id    uuid references rooms(id),
  new_room_id         uuid references rooms(id),
  readmission_date    date not null,
  readmission_fee     numeric not null default 500,
  reason              text,
  status              text default 'pending'
                        check (status in ('pending','approved','rejected')),
  approved_by         text,
  created_at          timestamptz default now()
);

-- ── HOSTEL SETTINGS ──────────────────────────────────────────────
create table if not exists hostel_settings (
  id                  uuid primary key default uuid_generate_v4(),
  hostel_name         text not null default 'DormHQ Hostel',
  address             text,
  phone               text,
  email               text,
  warden_name         text,
  lat                 numeric default 23.8103,  -- Default: Dhaka
  lng                 numeric default 90.4125,
  google_maps_api_key text,
  logo_url            text,
  welcome_message     text default 'Welcome to BCH - Bangladesh Christian Hostel',
  enable_meals        boolean default true,
  enable_complaints   boolean default true,
  enable_readmission  boolean default true,
  enable_notifications boolean default true,
  enable_reports      boolean default true,
  base_monthly_rent   numeric default 5000,
  readmission_fee     numeric default 500,
  security_deposit    numeric default 2000,
  late_fee_per_day    numeric default 200,
  due_day             integer default 10,
  currency_symbol     text default '৳',
  -- New customizable fields
  primary_color       text default '#f0a500',
  secondary_color     text default '#0f1623',
  accent_color        text default '#22c55e',
  font_family         text default 'Syne, sans-serif',
  date_format         text default 'DD/MM/YYYY',
  time_zone           text default 'Asia/Dhaka',
  working_hours_start text default '09:00',
  working_hours_end   text default '18:00',
  enable_weekends     boolean default false,
  custom_fields_residents jsonb default '[]',
  custom_fields_rooms  jsonb default '[]',
  email_template_welcome text default 'Welcome to BCH - Bangladesh Christian Hostel! Your room {room_number} is ready.',
  email_template_payment text default 'Payment of {amount} received. Thank you!',
  email_template_overdue text default 'Your payment of {amount} is overdue. Please pay by {due_date}.',
  notification_email  boolean default true,
  notification_sms    boolean default false,
  notification_push   boolean default true,
  dashboard_widgets   text default 'stats,occupancy,map,notifications',
  export_format       text default 'pdf',
  backup_frequency    text default 'daily',
  language            text default 'en',
  updated_at          timestamptz default now()
);

-- Insert default settings row
insert into hostel_settings (id) values (uuid_generate_v4())
on conflict do nothing;

-- ── TRANSPORTATION VEHICLES ─────────────────────────────────────
create table if not exists transportation_vehicles (
  id              uuid primary key default uuid_generate_v4(),
  vehicle_number  text not null unique,
  vehicle_type    text not null check (vehicle_type in ('Bus','Van','Car','Motorcycle','Other')),
  capacity        integer not null default 20,
  driver_name     text,
  driver_phone    text,
  status          text not null default 'available'
                    check (status in ('available','in_use','maintenance','out_of_service')),
  notes           text,
  created_at      timestamptz default now()
);

-- ── TRANSPORTATION ROUTES ────────────────────────────────────────
create table if not exists transportation_routes (
  id              uuid primary key default uuid_generate_v4(),
  route_name      text not null,
  origin          text not null,
  destination     text not null,
  departure_time  time not null,
  return_time     time,
  days_of_week    text[] default '{}', -- ['Monday','Tuesday',...]
  fare            numeric not null default 0,
  status          text not null default 'active'
                    check (status in ('active','inactive','suspended')),
  notes           text,
  created_at      timestamptz default now()
);

-- ── TRANSPORTATION BOOKINGS ──────────────────────────────────────
create table if not exists transportation_bookings (
  id                  uuid primary key default uuid_generate_v4(),
  resident_id         uuid references residents(id) on delete cascade,
  route_id            uuid references transportation_routes(id) on delete set null,
  vehicle_id          uuid references transportation_vehicles(id) on delete set null,
  booking_date        date not null,
  booking_time        time not null,
  trip_type           text not null check (trip_type in ('one_way','round_trip')),
  pickup_location     text,
  dropoff_location    text,
  passenger_count     integer not null default 1,
  fare                numeric not null,
  status              text not null default 'pending'
                        check (status in ('pending','confirmed','in_progress','completed','cancelled')),
  payment_status      text default 'pending'
                        check (payment_status in ('pending','paid','refunded')),
  payment_method      text check (payment_method in ('cash','bkash','nagad','rocket','bank','card')),
  notes               text,
  cancelled_at        timestamptz,
  cancelled_by        text,
  cancellation_reason  text,
  created_at          timestamptz default now()
);

-- ── USER PROFILES (extends Supabase auth.users) ──────────────────
create table if not exists profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text,
  full_name       text,
  role            text not null default 'student' check (role in ('admin','student')),
  resident_id     uuid references residents(id) on delete set null,
  phone           text,
  avatar_url      text,
  is_active       boolean default true,
  last_login      timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Policies for profiles
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Admins can view all profiles" on profiles
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all profiles" on profiles
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table complaints;
alter publication supabase_realtime add table fees;
alter publication supabase_realtime add table room_assignments;
alter publication supabase_realtime add table transportation_bookings;

-- ── INDEXES ──────────────────────────────────────────────────────
create index if not exists idx_fees_resident on fees(resident_id);
create index if not exists idx_fees_status on fees(status);
create index if not exists idx_assignments_resident on room_assignments(resident_id);
create index if not exists idx_assignments_status on room_assignments(status);
create index if not exists idx_rooms_status on rooms(status);
create index if not exists idx_residents_status on residents(status);
create index if not exists idx_notifications_read on notifications(is_read);
create index if not exists idx_transport_bookings_resident on transportation_bookings(resident_id);
create index if not exists idx_transport_bookings_route on transportation_bookings(route_id);
create index if not exists idx_transport_bookings_date on transportation_bookings(booking_date);
create index if not exists idx_transport_bookings_status on transportation_bookings(status);

-- ── ROW LEVEL SECURITY (RLS) POLICIES ────────────────────────────

-- Enable RLS on all tables
alter table rooms enable row level security;
alter table residents enable row level security;
alter table room_assignments enable row level security;
alter table fees enable row level security;
alter table meals enable row level security;
alter table complaints enable row level security;
alter table notifications enable row level security;
alter table readmissions enable row level security;
alter table transportation_vehicles enable row level security;
alter table transportation_routes enable row level security;
alter table transportation_bookings enable row level security;
alter table hostel_settings enable row level security;

-- Hostel Settings: Only admins can read/write
create policy "Admins can manage settings" on hostel_settings
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Rooms: Everyone can read, only admins can write
create policy "Everyone can view rooms" on rooms for select using (true);
create policy "Admins can manage rooms" on rooms
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Residents: Students can only see their own record, admins can see all
create policy "Students can view own resident record" on residents
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and resident_id = residents.id
    )
  );
create policy "Admins can manage residents" on residents
  for all using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Similar policies for other tables...
-- (Add more policies as needed for security)
