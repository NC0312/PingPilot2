'use client'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'

const linkClass = 'text-muted-foreground transition-colors duration-300 ease-fluid hover:text-foreground'

/** Footer link columns. Account links follow the sign-in state, so a signed-in visitor isn't offered "Sign in". */
export default function FooterNav() {
    const { user } = useAuth()

    return (
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-16 gap-y-8 text-sm sm:grid-cols-3">
            <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">Product</p>
                <ul className="space-y-3">
                    <li><a href="#features" className={linkClass}>Features</a></li>
                    <li><a href="#how" className={linkClass}>How it works</a></li>
                    <li><a href="#pricing" className={linkClass}>Pricing</a></li>
                </ul>
            </div>
            <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">Account</p>
                <ul className="space-y-3">
                    {user ? (
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
                    <li><Link href="/support" className={linkClass}>Contact support</Link></li>
                </ul>
            </div>
        </nav>
    )
}
