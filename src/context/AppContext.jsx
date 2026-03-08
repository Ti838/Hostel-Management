import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, isConnected, settingsApi, notificationsApi, authApi, profilesApi } from '../lib/supabase'
import { LANGUAGES, useTranslation } from '../lib/i18n'
import toast from 'react-hot-toast'

const AppContext = createContext()

// 5 beautiful themes
export const THEMES = {
  midnight: { name:'Midnight', bg:'#080c14', surface:'#0f1623', surface2:'#172033', border:'#1e2d45', accent:'#f0a500', accent2:'#e05c2f', text:'#e8f0fe', muted:'#7a8fa6', green:'#22c55e', red:'#ef4444', blue:'#3b82f6', purple:'#a78bfa' },
  slate:    { name:'Slate',    bg:'#f1f5f9', surface:'#ffffff', surface2:'#f8fafc', border:'#e2e8f0', accent:'#0f766e', accent2:'#0d9488', text:'#0f172a', muted:'#64748b', green:'#16a34a', red:'#dc2626', blue:'#2563eb', purple:'#7c3aed' },
  ocean:    { name:'Ocean',    bg:'#020b18', surface:'#041525', surface2:'#062035', border:'#0a3055', accent:'#06b6d4', accent2:'#0891b2', text:'#e0f2fe', muted:'#5b8fa8', green:'#10b981', red:'#f43f5e', blue:'#06b6d4', purple:'#8b5cf6' },
  forest:   { name:'Forest',  bg:'#030f07', surface:'#061409', surface2:'#0a1e0d', border:'#122b16', accent:'#4ade80', accent2:'#22c55e', text:'#dcfce7', muted:'#5c8a67', green:'#4ade80', red:'#f87171', blue:'#60a5fa', purple:'#c084fc' },
  crimson:  { name:'Crimson', bg:'#0f0508', surface:'#1a0810', surface2:'#250c17', border:'#3d1428', accent:'#f43f5e', accent2:'#e11d48', text:'#ffe4e6', muted:'#9f5a6e', green:'#4ade80', red:'#f43f5e', blue:'#60a5fa', purple:'#c084fc' },
}

export function AppProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem('dh-theme') || 'midnight')
  const [settings, setSettings] = useState({ 
    hostel_name:'DormHQ', 
    currency_symbol:'৳', 
    lat:23.8103, 
    lng:90.4125, 
    due_day:10, 
    readmission_fee:500, 
    base_monthly_rent:5000, 
    security_deposit:2000, 
    late_fee_per_day:200, 
    logo_url:'', 
    welcome_message:'Welcome to DormHQ', 
    enable_meals:true, 
    enable_complaints:true, 
    enable_readmission:true, 
    enable_notifications:true, 
    enable_reports:true,
    // New customizable options
    primary_color:'#f0a500',
    secondary_color:'#0f1623', 
    accent_color:'#22c55e',
    font_family:'Syne, sans-serif',
    date_format:'DD/MM/YYYY',
    time_zone:'Asia/Dhaka',
    working_hours_start:'09:00',
    working_hours_end:'18:00',
    enable_weekends:false,
    custom_fields_residents:[],
    custom_fields_rooms:[],
    email_template_welcome:'Welcome to {hostel_name}! Your room {room_number} is ready.',
    email_template_payment:'Payment of {amount} received. Thank you!',
    email_template_overdue:'Your payment of {amount} is overdue. Please pay by {due_date}.',
    notification_email:true,
    notification_sms:false,
    notification_push:true,
    dashboard_widgets:'stats,occupancy,map,notifications',
    export_format:'pdf',
    backup_frequency:'daily',
    language:'en'
  })
  const [notifications, setNotifications] = useState([])
  const [connected] = useState(isConnected)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState(() => localStorage.getItem('dh-lang') || 'en')
  const { t } = useTranslation(language)

  const theme = THEMES[themeName] || THEMES.midnight

  // Authentication
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await profilesApi.getCurrent()
        setProfile(profile)
      }
      setLoading(false)
    }
    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data: profile } = await profilesApi.getCurrent()
        setProfile(profile)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Auth methods
  const signUp = async (email, password, fullName) => {
    const { data, error } = await authApi.signUp(email, password, { full_name: fullName })
    if (error) throw error
    return data
  }

  const signIn = async (email, password) => {
    const { data, error } = await authApi.signIn(email, password)
    if (error) throw error
    return data
  }

  const signOut = async () => {
    const { error } = await authApi.signOut()
    if (error) throw error
  }

  const changeLanguage = (newLang) => {
    setLanguage(newLang)
    localStorage.setItem('dh-lang', newLang)
  }

  const isAdmin = profile?.role === 'admin'
  const isStudent = profile?.role === 'student'

  // Load settings from Supabase
  useEffect(() => {
    if (!connected) return
    settingsApi.get().then(({ data }) => { if (data) setSettings(data) })
  }, [connected])

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!connected) return
    const { data } = await notificationsApi.getAll()
    if (data) setNotifications(data)
  }, [connected])

  useEffect(() => { loadNotifications() }, [loadNotifications])

  // Realtime notifications
  useEffect(() => {
    if (!connected) return
    const unsub = notificationsApi.subscribeNew((payload) => {
      const n = payload.new
      setNotifications(prev => [n, ...prev])
      toast(n.title, { icon: n.type === 'payment' ? '💳' : n.type === 'alert' ? '🚨' : 'ℹ️' })
    })
    return unsub
  }, [connected])

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <AppContext.Provider value={{
      theme, themeName, setThemeName, themes: THEMES,
      settings, setSettings,
      notifications, setNotifications, loadNotifications, unreadCount,
      connected,
      user, profile, loading, signUp, signIn, signOut, isAdmin, isStudent,
      language, setLanguage: changeLanguage, LANGUAGES, t,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
