import { useState, useEffect } from 'react'
import { roomsApi, feesApi, complaintsApi, mealsApi, assignmentsApi } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { SvgIcon, ICONS, Empty, Spinner } from './ui'
import { format } from 'date-fns'

export default function StudentDashboard({ onNav }) {
    const { profile, settings, connected, t } = useApp()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        room: null,
        fees: [],
        complaints: [],
        meals: []
    })

    useEffect(() => {
        if (!connected || !profile?.resident_id) {
            setLoading(false)
            return
        }

        const loadData = async () => {
            const resId = profile.resident_id
            const today = format(new Date(), 'yyyy-MM-dd')

            try {
                const [roomData, feeData, complaintData, mealData] = await Promise.all([
                    assignmentsApi.getActive(), // This might need a custom query for current resident's room
                    feesApi.getByRes(resId),
                    complaintsApi.getAll(), // Will need filtering
                    mealsApi.getWeek(today, today)
                ])

                // Filter data for the specific student
                const personalComplaints = complaintData.data?.filter(c => c.resident_id === resId) || []
                const personalRoom = roomData.data?.find(a => a.resident_id === resId)

                setData({
                    room: personalRoom?.rooms || null,
                    fees: feeData.data?.filter(f => f.status !== 'paid') || [],
                    complaints: personalComplaints.slice(0, 3),
                    meals: mealData.data || []
                })
            } catch (err) {
                console.error('Error loading student dashboard:', err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [connected, profile])

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>

    const pendingFees = data.fees.reduce((sum, f) => sum + (f.amount - (f.paid_amount || 0)), 0)

    return (
        <div className="student-dashboard">
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 28, marginBottom: 8 }}>
                    {t('welcome')}, {profile?.full_name?.split(' ')[0] || 'Student'}!
                </h1>
                <p style={{ color: 'var(--muted)' }}>Here's what's happening today at {settings.hostel_name}.</p>
            </div>

            <div className="g-3 fu fu2" style={{ marginBottom: 24 }}>
                {/* My Stay Card */}
                <div className="card glass" style={{ background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)', border: '1px solid var(--accent)' }}>
                    <div className="card-hdr">
                        <div className="card-title">🏠 My Stay</div>
                        <span className="badge badge-accent">Active</span>
                    </div>
                    {data.room ? (
                        <div style={{ padding: '0 4px' }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>Room {data.room.room_number}</div>
                            <div style={{ fontSize: 14, color: 'var(--text)' }}>{data.room.type} Floor • Floor {data.room.floor}</div>
                            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>Rent: {settings.currency_symbol}{data.room.monthly_rent?.toLocaleString()}/mo</div>
                        </div>
                    ) : (
                        <Empty icon="🛌" title="No active room" sub="Contact admin for assignment" />
                    )}
                </div>

                {/* Financial Snapshot */}
                <div className="card">
                    <div className="card-hdr">
                        <div className="card-title">💳 My Dues</div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: pendingFees > 0 ? 'var(--red)' : 'var(--green)' }}>
                        {settings.currency_symbol}{pendingFees.toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                        {data.fees.length} pending bill(s)
                    </div>
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={() => onNav('billing')}>
                        View Payment History →
                    </button>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-hdr">
                        <div className="card-title">⚡ Quick Actions</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn btn-accent btn-sm" onClick={() => onNav('complaints')}>
                            <SvgIcon d={ICONS.alert} size={14} style={{ marginRight: 6 }} /> Report an Issue
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => onNav('meals')}>
                            <SvgIcon d={ICONS.food} size={14} style={{ marginRight: 6 }} /> Check Meal Menu
                        </button>
                    </div>
                </div>
            </div>

            <div className="g-2 fu fu2">
                {/* Today's Meals */}
                <div className="card">
                    <div className="card-hdr">
                        <div className="card-title">🍽️ Today's Menu</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        {['breakfast', 'lunch', 'dinner'].map(type => {
                            const meal = data.meals.find(m => m.meal_type === type)
                            return (
                                <div key={type} style={{ textAlign: 'center', padding: 12, background: 'var(--surface2)', borderRadius: 8 }}>
                                    <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{type}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600 }}>{meal ? (meal.is_special ? '✨ Special' : 'Regular') : 'Not set'}</div>
                                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, height: 32, overflow: 'hidden' }}>
                                        {meal?.menu_items?.join(', ') || 'Waiting for menu...'}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* My Recent Complaints */}
                <div className="card">
                    <div className="card-hdr">
                        <div className="card-title">🚨 My Complaints</div>
                        <button className="link btn-sm" onClick={() => onNav('complaints')}>View All</button>
                    </div>
                    {data.complaints.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {data.complaints.map(c => (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--surface2)', borderRadius: 8 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600 }}>{c.title}</div>
                                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{format(new Date(c.created_at), 'MMM d, h:mm a')}</div>
                                    </div>
                                    <span className={`badge ${c.status === 'resolved' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: 10 }}>
                                        {c.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty icon="✅" title="No active issues" sub="Everything looks good!" />
                    )}
                </div>
            </div>
        </div>
    )
}
