import { createClient } from '@supabase/supabase-js'

const URL  = import.meta.env.VITE_SUPABASE_URL  || ''
const KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(URL, KEY)
export const isConnected = Boolean(URL && KEY && !URL.includes('placeholder') && !URL.includes('dummy'))

// ── AUTHENTICATION ────────────────────────────────────────────────
export const authApi = {
  signUp: (email, password, metadata = {}) => supabase.auth.signUp({ email, password, options: { data: metadata } }),
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
  signOut: () => supabase.auth.signOut(),
  getUser: () => supabase.auth.getUser(),
  onAuthStateChange: (callback) => supabase.auth.onAuthStateChange(callback),
  resetPassword: (email) => supabase.auth.resetPasswordForEmail(email),
  updatePassword: (password) => supabase.auth.updateUser({ password }),
  updateProfile: (updates) => supabase.auth.updateUser({ data: updates }),
}

// ── PROFILES ──────────────────────────────────────────────────────
export const profilesApi = {
  getCurrent: () => supabase.from('profiles').select('*').single(),
  update: (id, data) => supabase.from('profiles').update(data).eq('id', id).select().single(),
  getAll: () => supabase.from('profiles').select('*').order('created_at'),
  setRole: (id, role) => supabase.from('profiles').update({ role }).eq('id', id).select().single(),
}

// ── ROOMS ────────────────────────────────────────────────────────
export const roomsApi = {
  getAll:   ()          => supabase.from('rooms').select('*').order('floor').order('room_number'),
  getById:  (id)        => supabase.from('rooms').select('*').eq('id', id).single(),
  create:   (d)         => supabase.from('rooms').insert(d).select().single(),
  update:   (id, d)     => supabase.from('rooms').update(d).eq('id', id).select().single(),
  delete:   (id)        => supabase.from('rooms').delete().eq('id', id),
  available:()          => supabase.from('rooms').select('*').eq('status','available').order('room_number'),
}

// ── RESIDENTS ────────────────────────────────────────────────────
export const residentsApi = {
  getAll:   ()          => supabase.from('residents')
                            .select(`*, room_assignments!room_assignments_resident_id_fkey(id, room_id, check_in_date, expected_checkout, in_time, out_time, status, rooms(room_number,type,monthly_rent,floor))`)
                            .order('created_at', { ascending: false }),
  getById:  (id)        => supabase.from('residents')
                            .select(`*, room_assignments!room_assignments_resident_id_fkey(*, rooms(*))`)
                            .eq('id', id).single(),
  create:   (d)         => supabase.from('residents').insert(d).select().single(),
  update:   (id, d)     => supabase.from('residents').update(d).eq('id', id).select().single(),
  active:   ()          => supabase.from('residents').select(`*, room_assignments!room_assignments_resident_id_fkey(*, rooms(*))`)
                            .eq('status','active').order('full_name'),
}

// ── ROOM ASSIGNMENTS ─────────────────────────────────────────────
export const assignmentsApi = {
  getAll:   ()          => supabase.from('room_assignments')
                            .select(`*, residents(full_name,phone), rooms(room_number,type,floor)`)
                            .order('created_at', { ascending: false }),
  getActive:()          => supabase.from('room_assignments')
                            .select(`*, residents(full_name,phone,id), rooms(room_number,type,floor,monthly_rent)`)
                            .eq('status','active').order('created_at', { ascending: false }),
  create:   (d)         => supabase.from('room_assignments').insert(d).select().single(),
  update:   (id, d)     => supabase.from('room_assignments').update(d).eq('id', id).select().single(),
  checkout: (id, d)     => supabase.from('room_assignments')
                            .update({ status:'completed', actual_checkout: new Date().toISOString(), ...d })
                            .eq('id', id),
}

// ── FEES ─────────────────────────────────────────────────────────
export const feesApi = {
  getAll:   ()          => supabase.from('fees')
                            .select(`*, residents(full_name,phone)`)
                            .order('created_at', { ascending: false }),
  getByRes: (rid)       => supabase.from('fees').select('*').eq('resident_id', rid).order('due_date'),
  create:   (d)         => supabase.from('fees').insert(d).select().single(),
  update:   (id, d)     => supabase.from('fees').update(d).eq('id', id).select().single(),
  markPaid: (id, method, ref, amount) =>
                           supabase.from('fees').update({
                             status: 'paid',
                             paid_date: new Date().toISOString().split('T')[0],
                             payment_method: method,
                             transaction_ref: ref || null,
                             paid_amount: amount,
                           }).eq('id', id).select().single(),
  delete:   (id)        => supabase.from('fees').delete().eq('id', id),
}

// ── MEALS ────────────────────────────────────────────────────────
export const mealsApi = {
  getWeek:  (start,end) => supabase.from('meals').select('*')
                            .gte('meal_date', start).lte('meal_date', end)
                            .order('meal_date').order('meal_type'),
  upsert:   (d)         => supabase.from('meals').upsert(d, { onConflict: 'meal_date,meal_type' }).select(),
  delete:   (id)        => supabase.from('meals').delete().eq('id', id),
}

// ── COMPLAINTS ───────────────────────────────────────────────────
export const complaintsApi = {
  getAll:   ()          => supabase.from('complaints')
                            .select(`*, residents(full_name), rooms(room_number)`)
                            .order('created_at', { ascending: false }),
  create:   (d)         => supabase.from('complaints').insert(d).select().single(),
  update:   (id, d)     => supabase.from('complaints').update(d).eq('id', id).select().single(),
}

// ── NOTIFICATIONS ────────────────────────────────────────────────
export const notificationsApi = {
  getAll:   ()          => supabase.from('notifications').select('*').order('created_at', { ascending: false }),
  create:   (d)         => supabase.from('notifications').insert(d).select().single(),
  markRead: (id)        => supabase.from('notifications').update({ is_read: true }).eq('id', id),
  markAllRead: ()       => supabase.from('notifications').update({ is_read: true }).eq('is_read', false),
  delete:   (id)        => supabase.from('notifications').delete().eq('id', id),
  subscribeNew: (cb)    => {
    const ch = supabase.channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, cb)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }
}

// ── READMISSIONS ─────────────────────────────────────────────────
export const readmissionsApi = {
  getAll:   ()          => supabase.from('readmissions')
                            .select(`*, residents(full_name,phone), previous_room:previous_room_id(room_number), new_room:new_room_id(room_number)`)
                            .order('created_at', { ascending: false }),
  create:   (d)         => supabase.from('readmissions').insert(d).select().single(),
  update:   (id, d)     => supabase.from('readmissions').update(d).eq('id', id).select().single(),
}

// ── TRANSPORTATION VEHICLES ─────────────────────────────────────
export const vehiclesApi = {
  getAll:   ()          => supabase.from('transportation_vehicles').select('*').order('vehicle_number'),
  getById:  (id)        => supabase.from('transportation_vehicles').select('*').eq('id', id).single(),
  create:   (d)         => supabase.from('transportation_vehicles').insert(d).select().single(),
  update:   (id, d)     => supabase.from('transportation_vehicles').update(d).eq('id', id).select().single(),
  delete:   (id)        => supabase.from('transportation_vehicles').delete().eq('id', id),
  available:()          => supabase.from('transportation_vehicles').select('*').eq('status','available').order('vehicle_number'),
}

// ── TRANSPORTATION ROUTES ───────────────────────────────────────
export const routesApi = {
  getAll:   ()          => supabase.from('transportation_routes').select('*').order('route_name'),
  getById:  (id)        => supabase.from('transportation_routes').select('*').eq('id', id).single(),
  create:   (d)         => supabase.from('transportation_routes').insert(d).select().single(),
  update:   (id, d)     => supabase.from('transportation_routes').update(d).eq('id', id).select().single(),
  delete:   (id)        => supabase.from('transportation_routes').delete().eq('id', id),
  active:   ()          => supabase.from('transportation_routes').select('*').eq('status','active').order('departure_time'),
}

// ── TRANSPORTATION BOOKINGS ──────────────────────────────────────
export const transportBookingsApi = {
  getAll:   ()          => supabase.from('transportation_bookings')
                            .select(`*, residents(full_name,phone), 
                                     route:transportation_routes(route_name,origin,destination,departure_time,return_time),
                                     vehicle:transportation_vehicles(vehicle_number,vehicle_type,driver_name,driver_phone)`)
                            .order('booking_date', { ascending: false })
                            .order('booking_time', { ascending: false }),
  getById:  (id)        => supabase.from('transportation_bookings')
                            .select(`*, residents(*), 
                                     route:transportation_routes(*),
                                     vehicle:transportation_vehicles(*)`)
                            .eq('id', id).single(),
  getByRes: (rid)       => supabase.from('transportation_bookings')
                            .select(`*, route:transportation_routes(*), vehicle:transportation_vehicles(*)`)
                            .eq('resident_id', rid).order('booking_date', { ascending: false }),
  create:   (d)         => supabase.from('transportation_bookings').insert(d).select().single(),
  update:   (id, d)     => supabase.from('transportation_bookings').update(d).eq('id', id).select().single(),
  cancel:   (id, reason) => supabase.from('transportation_bookings')
                            .update({ 
                              status: 'cancelled',
                              cancelled_at: new Date().toISOString(),
                              cancellation_reason: reason 
                            })
                            .eq('id', id).select().single(),
  delete:   (id)        => supabase.from('transportation_bookings').delete().eq('id', id),
}

// ── SETTINGS ─────────────────────────────────────────────────────
export const settingsApi = {
  get:      ()          => supabase.from('hostel_settings').select('*').single(),
  update:   (id, d)     => supabase.from('hostel_settings').update({ ...d, updated_at: new Date().toISOString() }).eq('id', id).select().single(),
}
