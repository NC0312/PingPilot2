'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    SquaresFour,
    HardDrives,
    ChatCircleDots,
    CreditCard,
    ShieldCheck,
    ChartBar,
    UsersThree,
    Tray,
    SignOut,
    SidebarSimple,
    List,
    X,
    Plus,
    UserCircle,
} from '@phosphor-icons/react';
import { Brand } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';

// One destination per row. `match` decides the active state so nested routes keep their parent lit.
const MONITOR_ITEMS = [
    { name: 'Dashboard', icon: SquaresFour, href: '/dashboard' },
    { name: 'Servers', icon: HardDrives, href: '/servers' },
];
// Everything about you rather than your servers. Admins have no plan to manage, so theirs is shorter.
const ACCOUNT_ITEM = { name: 'Account', icon: UserCircle, href: '/account' };
const USER_ITEMS = [
    { name: 'Plan & billing', icon: CreditCard, href: '/subscription' },
    ACCOUNT_ITEM,
    { name: 'Support', icon: ChatCircleDots, href: '/support/tickets' },
];
const ADMIN_ITEMS = [
    { name: 'Platform', icon: ShieldCheck, href: '/admin', exact: true },
    { name: 'Analytics', icon: ChartBar, href: '/admin/analytics' },
    { name: 'Users', icon: UsersThree, href: '/admin/users' },
    { name: 'Tickets', icon: Tray, href: '/admin/support' },
];

const isActive = (pathname, item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

function NavItem({ item, collapsed, onNavigate }) {
    const pathname = usePathname();
    const active = isActive(pathname, item);
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            title={collapsed ? item.name : undefined}
            className={`group relative flex h-11 items-center gap-3 rounded-full text-sm transition-[background-color,color] duration-500 ease-fluid ${collapsed ? 'w-11 justify-center' : 'px-3.5'} ${active
                ? 'bg-white/[0.08] font-medium text-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.06)]'
                : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground'
                }`}
        >
            <Icon weight={active ? 'regular' : 'light'} className={`size-[22px] shrink-0 transition-colors duration-500 ease-fluid ${active ? 'text-primary' : ''}`} />
            <span className={collapsed ? 'sr-only' : 'truncate'}>{item.name}</span>
            {collapsed && (
                <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-full bg-popover px-3 py-1.5 text-xs font-medium text-foreground opacity-0 shadow-[0_0_0_1px_oklch(1_0_0/0.08),0_12px_24px_-12px_oklch(0_0_0/0.6)] transition-[opacity,transform] duration-300 ease-fluid group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" style={{ zIndex: 'var(--z-overlay)' }} aria-hidden="true">
                    {item.name}
                </span>
            )}
        </Link>
    );
}

// Adding a server is the main thing people do here, so it is one click from every page.
function AddServerButton({ collapsed, onNavigate }) {
    const pathname = usePathname();
    if (pathname === '/servers/new') return null;
    return collapsed ? (
        <Button asChild size="icon" className="mx-auto mt-3">
            <Link href="/servers/new" onClick={onNavigate} aria-label="Add server" title="Add server">
                <Plus weight="bold" />
            </Link>
        </Button>
    ) : (
        <Button asChild className="mt-3 w-full">
            <Link href="/servers/new" onClick={onNavigate}>
                <Plus weight="bold" />
                Add server
            </Link>
        </Button>
    );
}

function NavGroup({ label, items, collapsed, onNavigate }) {
    return (
        <div>
            {collapsed ? (
                <div className="mx-auto my-3 h-px w-6 bg-white/[0.08]" />
            ) : (
                <p className="mb-2 mt-6 px-3.5 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">{label}</p>
            )}
            <div className={`space-y-1 ${collapsed ? 'flex flex-col items-center' : ''}`}>
                {items.map((item) => (
                    <NavItem key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
                ))}
            </div>
        </div>
    );
}

function UserBlock({ user, collapsed, onLogout, onNavigate }) {
    const name = user?.displayName || user?.email || 'Account';
    const initial = name.trim().charAt(0).toUpperCase();
    return (
        <div className={`flex items-center gap-1 ${collapsed ? 'flex-col' : ''}`}>
            <Link
                href="/account"
                onClick={onNavigate}
                aria-label={`Account settings for ${name}`}
                title={collapsed ? `${name}: account settings` : undefined}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 transition-colors duration-300 ease-fluid hover:bg-white/[0.05]"
            >
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white/[0.07] font-display text-sm font-medium text-foreground ring-1 ring-white/10" aria-hidden="true">
                    {user?.photoURL ? <img src={user.photoURL} alt="" className="size-full object-cover" /> : initial}
                </span>
                {!collapsed && (
                    <span className="min-w-0 flex-1 text-left">
                        <span className="block truncate text-sm font-medium">{name}</span>
                        <span className="block text-xs capitalize text-muted-foreground">{user?.role || 'user'}</span>
                    </span>
                )}
            </Link>
            <button
                type="button"
                onClick={onLogout}
                aria-label="Sign out"
                title="Sign out"
                className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground transition-[background-color,color,transform] duration-500 ease-fluid hover:bg-destructive/12 hover:text-destructive active:scale-95"
            >
                <SignOut weight="light" className="size-5" />
            </button>
        </div>
    );
}

const SideBar = ({ collapsed = false, onToggle }) => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!mobileOpen) return;
        const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [mobileOpen]);

    const handleLogout = async () => {
        try {
            await logout('/');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const isAdminUser = user?.role === 'admin';
    const groups = [
        { label: 'Monitor', items: MONITOR_ITEMS },
        ...(isAdminUser ? [{ label: 'Admin', items: ADMIN_ITEMS }] : []),
        { label: 'Manage', items: isAdminUser ? [ACCOUNT_ITEM] : USER_ITEMS },
    ];

    const renderGroups = (isCollapsed, onNavigate) =>
        groups.map((g) => <NavGroup key={g.label} label={g.label} items={g.items} collapsed={isCollapsed} onNavigate={onNavigate} />);

    return (
        <>
            {/* Desktop: floating panel, expanded by default, opt-in icon rail */}
            <aside
                aria-label="Main"
                className={`fixed bottom-3 left-3 top-3 hidden transition-[width] duration-700 ease-fluid md:block ${collapsed ? 'w-[76px]' : 'w-[248px]'}`}
                style={{ zIndex: 'var(--z-sidebar)' }}
            >
                <div className="bezel-sm h-full">
                    <div className="bezel-sm-core flex h-full flex-col bg-sidebar p-3">
                        <div className={`flex h-12 items-center ${collapsed ? 'justify-center' : 'justify-between pl-1'}`}>
                            <Brand href="/dashboard" showWord={!collapsed} className={collapsed ? '[&>span:first-child]:scale-95' : ''} />
                            {!collapsed && (
                                <button
                                    type="button"
                                    onClick={onToggle}
                                    aria-label="Collapse sidebar"
                                    aria-expanded="true"
                                    className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-white/[0.06] hover:text-foreground"
                                >
                                    <SidebarSimple weight="light" className="size-5" />
                                </button>
                            )}
                        </div>
                        {collapsed && (
                            <button
                                type="button"
                                onClick={onToggle}
                                aria-label="Expand sidebar"
                                aria-expanded="false"
                                className="mx-auto mt-2 grid size-11 place-items-center rounded-full text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-white/[0.06] hover:text-foreground"
                            >
                                <SidebarSimple weight="light" className="size-5 -scale-x-100" />
                            </button>
                        )}

                        <AddServerButton collapsed={collapsed} />

                        <nav aria-label="Primary" className="-mx-1 mt-2 flex-1 overflow-y-auto overflow-x-hidden px-1">
                            {renderGroups(collapsed)}
                        </nav>

                        <div className="mt-3 border-t border-white/[0.07] pt-3">
                            <UserBlock user={user} collapsed={collapsed} onLogout={handleLogout} />
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile: floating bar + full-screen menu */}
            <div className="sticky top-0 px-3 pt-3 md:hidden" style={{ zIndex: 'var(--z-nav)' }}>
                <div className="glass flex items-center justify-between rounded-full py-2 pl-3 pr-2">
                    <Brand href="/dashboard" />
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={mobileOpen}
                        aria-controls="app-mobile-menu"
                        className="grid size-10 place-items-center rounded-full bg-white/[0.06] transition-colors duration-300 ease-fluid hover:bg-white/[0.1] active:scale-95"
                    >
                        <List weight="light" className="size-5" />
                    </button>
                </div>
            </div>

            <div
                id="app-mobile-menu"
                aria-hidden={!mobileOpen}
                inert={!mobileOpen}
                className={`fixed inset-0 bg-background/90 backdrop-blur-3xl transition-[opacity,visibility] duration-700 ease-fluid md:hidden ${mobileOpen ? 'visible opacity-100' : 'invisible opacity-0'}`}
                style={{ zIndex: 'var(--z-overlay)' }}
            >
                <div className="flex h-full flex-col px-5 pb-6 pt-4">
                    <div className="flex items-center justify-between">
                        <Brand href="/dashboard" />
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close menu"
                            className="grid size-10 place-items-center rounded-full bg-white/[0.06] transition-colors duration-300 ease-fluid hover:bg-white/[0.1] active:scale-95"
                        >
                            <X weight="light" className="size-5" />
                        </button>
                    </div>
                    <AddServerButton collapsed={false} onNavigate={() => setMobileOpen(false)} />
                    <nav aria-label="Mobile" className="mt-2 flex-1 overflow-y-auto">
                        {renderGroups(false, () => setMobileOpen(false))}
                    </nav>
                    <div className="border-t border-white/[0.07] pt-4">
                        <UserBlock user={user} collapsed={false} onLogout={handleLogout} onNavigate={() => setMobileOpen(false)} />
                    </div>
                </div>
            </div>
        </>
    );
};

export default SideBar;
