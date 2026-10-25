'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'
import { Brand } from '@/components/ui/brand'
import { Button, ButtonArrow } from '@/components/ui/button'

const NAV_LINKS = [
    { label: 'Features', href: '/#features' },
    { label: 'How it works', href: '/#how' },
    { label: 'Pricing', href: '/pricing' },
]

const Navbar = () => {
    const { user } = useAuth()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        const onKey = (e) => e.key === 'Escape' && setOpen(false)
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('keydown', onKey)
            document.body.style.overflow = prev
        }
    }, [open])

    const primary = user
        ? { href: '/dashboard', label: 'Dashboard' }
        : { href: '/auth?mode=signup', label: 'Start free' }

    return (
        <header
            className="fixed inset-x-0 top-4 flex justify-center px-4 sm:top-6"
            style={{ zIndex: open ? 'var(--z-overlay)' : 'var(--z-nav)' }}
        >
            {/* Expanded menu: full-screen glass */}
            <div
                id="mobile-menu"
                aria-hidden={!open}
                inert={!open}
                className={`fixed inset-0 bg-background/85 backdrop-blur-3xl transition-[opacity,visibility] duration-700 ease-fluid md:hidden ${open ? 'visible opacity-100' : 'invisible opacity-0'}`}
            >
                <nav aria-label="Mobile" className="flex h-full flex-col justify-center gap-2 px-8 pb-10 pt-24">
                    {NAV_LINKS.map((l, i) => (
                        <a
                            key={l.href}
                            href={l.href}
                            onClick={() => setOpen(false)}
                            style={{ transitionDelay: open ? `${100 + i * 70}ms` : '0ms' }}
                            className={`font-display text-4xl font-medium tracking-tight text-foreground transition-[opacity,transform] duration-700 ease-fluid ${open ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                        >
                            {l.label}
                        </a>
                    ))}
                    <div
                        style={{ transitionDelay: open ? '340ms' : '0ms' }}
                        className={`mt-8 flex flex-col gap-3 transition-[opacity,transform] duration-700 ease-fluid ${open ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}`}
                    >
                        <Button asChild size="lg" onClick={() => setOpen(false)}>
                            <Link href={primary.href}>
                                {primary.label}
                                <ButtonArrow />
                            </Link>
                        </Button>
                        {!user && (
                            <Button asChild size="lg" variant="outline" onClick={() => setOpen(false)}>
                                <Link href="/auth">Sign in</Link>
                            </Button>
                        )}
                    </div>
                </nav>
            </div>

            {/* Floating pill */}
            <div className="glass relative flex w-full max-w-3xl items-center justify-between rounded-full py-2 pl-3 pr-2">
                <Brand />

                <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
                    {NAV_LINKS.map((l) => (
                        <a
                            key={l.href}
                            href={l.href}
                            className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-white/[0.06] hover:text-foreground"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-1.5 md:flex">
                    {!user && (
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/auth">Sign in</Link>
                        </Button>
                    )}
                    <Button asChild size="sm" className="pr-1">
                        <Link href={primary.href}>
                            {primary.label}
                            <ButtonArrow className="size-6" />
                        </Link>
                    </Button>
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    aria-expanded={open}
                    aria-controls="mobile-menu"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    className="relative grid size-10 place-items-center rounded-full bg-white/[0.06] transition-colors duration-300 ease-fluid hover:bg-white/[0.1] active:scale-95 md:hidden"
                >
                    <span
                        className={`absolute h-px w-4 bg-foreground transition-transform duration-500 ease-fluid ${open ? 'rotate-45' : '-translate-y-[3px]'}`}
                    />
                    <span
                        className={`absolute h-px w-4 bg-foreground transition-transform duration-500 ease-fluid ${open ? '-rotate-45' : 'translate-y-[3px]'}`}
                    />
                </button>
            </div>
        </header>
    )
}

export default Navbar
