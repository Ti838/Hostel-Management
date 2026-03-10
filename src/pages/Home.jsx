import { motion } from 'framer-motion'
import { SvgIcon, ICONS } from '../components/ui'
import { useApp } from '../context/AppContext'
import logo from '../assets/logo.png'

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' }
}

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.2
        }
    }
}

export default function Home({ onLogin }) {
    const { settings, toggleTheme, themeName } = useApp()

    return (
        <div className="home-page" style={{ overflowX: 'hidden' }}>
            <button
                onClick={toggleTheme}
                className="btn btn-ghost"
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    zIndex: 100,
                    borderRadius: '50%',
                    width: 40,
                    height: 40,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)'
                }}
            >
                {themeName === 'midnight' ? '🌙' : '☀️'}
            </button>
            {/* Hero Section */}
            <section className="hero" style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                background: 'radial-gradient(circle at center, var(--surface) 0%, var(--bg) 100%)',
                padding: '80px 20px 120px',
                position: 'relative'
            }}>
                {/* Animated Background Icons */}
                <motion.div
                    style={{ position: 'absolute', top: '10%', left: '10%', opacity: 0.1, color: 'var(--accent)' }}
                    animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                >
                    <SvgIcon d={ICONS.home} size={80} />
                </motion.div>
                <motion.div
                    style={{ position: 'absolute', bottom: '15%', right: '12%', opacity: 0.1, color: 'var(--blue)' }}
                    animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }}
                    transition={{ duration: 7, repeat: Infinity }}
                >
                    <SvgIcon d={ICONS.users} size={100} />
                </motion.div>

                <motion.div {...fadeInUp}>
                    <img
                        src={logo}
                        alt="BCH Logo"
                        style={{ width: 120, height: 120, margin: '0 auto 24px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--surface)', filter: 'drop-shadow(0 0 20px rgba(240,165,0,0.3))' }}
                    />
                    <h1 style={{
                        fontFamily: 'Fraunces, serif',
                        fontSize: 'max(48px, 6vw)',
                        marginBottom: 20,
                        lineHeight: 1.1,
                        background: 'linear-gradient(to bottom, var(--text) 30%, var(--muted) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        A Home Away<br />From Home
                    </h1>
                    <p style={{
                        fontSize: 18,
                        color: 'var(--muted)',
                        maxWidth: 600,
                        margin: '0 auto 40px',
                        fontFamily: 'Syne, sans-serif'
                    }}>
                        Welcome to {settings.hostel_name}. Experience safe, modern, and spiritual living designed for the students of today.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button className="btn btn-accent btn-lg" onClick={onLogin} style={{ padding: '16px 36px', fontSize: 16 }}>
                            Get Started →
                        </button>
                        <button className="btn btn-ghost btn-lg" onClick={onLogin} style={{ padding: '16px 36px', fontSize: 16, border: '1px solid var(--border)' }}>
                            Sign In
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: 'var(--muted)', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
                >
                    Scroll to explore
                    <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>↓</motion.div>
                </motion.div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '100px 20px', maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 60 }}>
                    <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 36, marginBottom: 12 }}>Designed for Excellence</h2>
                    <p style={{ color: 'var(--muted)' }}>Smart management meets student comfort.</p>
                </div>

                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    className="g-3"
                >
                    {[
                        { title: 'Premium Security', icon: 'check', desc: 'GPS-enabled check-in/out and 24/7 monitoring for your safety.', color: 'var(--accent)' },
                        { title: 'Smart Finance', icon: 'card', desc: 'Easy digital payments with MFS (bKash, Nagad) and PDF receipts.', color: 'var(--blue)' },
                        { title: 'Meal Planning', icon: 'food', desc: 'Digital meal tracking and weekly menu planners for healthy living.', color: 'var(--purple)' }
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            variants={fadeInUp}
                            className="card glass"
                            style={{ padding: 40, textAlign: 'center', height: '100%' }}
                        >
                            <div style={{
                                width: 60,
                                height: 60,
                                background: `rgba(${item.color === 'var(--accent)' ? '240,165,0' : item.color === 'var(--blue)' ? '59,130,246' : '167,139,250'}, 0.1)`,
                                color: item.color,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <SvgIcon d={ICONS[item.icon]} size={24} />
                            </div>
                            <h3 style={{ marginBottom: 16 }}>{item.title}</h3>
                            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{item.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </section>

            {/* Values Section */}
            <section style={{ padding: '80px 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 42, marginBottom: 24 }}>Built on Trust</h2>
                        <p style={{ fontSize: 18, lineHeight: 1.8, color: 'var(--text)', opacity: 0.9 }}>
                            Bangladesh Christian Hostel (BCH) is more than just a place to sleep. We provide a disciplined, supportive, and spiritually enriching environment that helps you focus on your studies and build a brighter future.
                        </p>
                        <div style={{ marginTop: 40, borderTop: '1px solid var(--border)', paddingTop: 40 }}>
                            <p style={{ fontSize: 13, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Trusted by the local community</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ padding: '60px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 24, marginBottom: 8, color: 'var(--accent)' }}>{settings.hostel_name}</div>
                <p style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, marginBottom: 12 }}>Developed by <span style={{ color: 'var(--accent)', fontWeight: 700 }}>TIMON BISWAS</span></p>
                <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 24 }}>© {new Date().getFullYear()} — Licensed Proprietary Software. All Rights Reserved.</p>
            </footer>
        </div>
    )
}
