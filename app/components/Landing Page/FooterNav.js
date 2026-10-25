'use client'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'

const linkClass = 'text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground'

/** Footer link columns. Account links follow the sign-in state, so a signed-in visitor isn't offered "Sign in". */
export default function FooterNav() {
    const { authView } = useAuth()

    return (
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-16 gap-y-8 text-sm sm:grid-cols-3">
            <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">Product</p>
                <ul className="space-y-3">
                    <li><Link href="/website-uptime-monitoring" className={linkClass}>Website uptime monitoring</Link></li>
                    <li><Link href="/server-monitoring" className={linkClass}>Server monitoring</Link></li>
                    <li><Link href="/#features" className={linkClass}>Features</Link></li>
                    <li><Link href="/pricing" className={linkClass}>Pricing</Link></li>
                    <li><Link href="/android-app" className={linkClass}>Android app</Link></li>
                    <li><Link href="/docs" className={linkClass}>Documentation</Link></li>
                </ul>
            </div>
            <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">Account</p>
                <ul className={`space-y-3 ${authView === 'pending' ? 'invisible' : ''}`}>
                    {authView === 'in' ? (
                        <li><Link href="/dashboard" className={linkClass}>Dashboard</Link></li>
                    ) : (
                        <>
                            <li><Link href="/auth" className={linkClass}>Sign in</Link></li>
                            <li><Link href="/auth?mode=signup" className={linkClass}>Create account</Link></li>
                        </>
                    )}
                </ul>
            </div>
            <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">Help</p>
                <ul className="space-y-3">
                    <li><Link href="/blog" className={linkClass}>Blog</Link></li>
                    <li><Link href="/alternatives/uptimerobot" className={linkClass}>UptimeRobot alternative</Link></li>
                    <li><Link href="/alternatives/pingdom" className={linkClass}>Pingdom alternative</Link></li>
                    <li><Link href="/support" className={linkClass}>Contact support</Link></li>
                    <li><Link href="/privacy" className={linkClass}>Privacy Policy</Link></li>
                    <li><Link href="/terms" className={linkClass}>Terms of Service</Link></li>
                </ul>
            </div>
        </nav>
    )
}
