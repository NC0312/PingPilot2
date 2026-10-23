'use client';

import React, { useState, useEffect } from 'react';
import SideBar from './SideBar';

const STORAGE_KEY = 'pp.sidebar.collapsed';

/**
 * Authenticated chrome: floating sidebar + content column.
 * Expanded is the default; the icon rail is an opt-in that is remembered per browser.
 * Pages render inside <main id="main-content"> and own their own max-width and padding
 * through `<PageContainer>` below.
 */
export default function AppShell({ children }) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem(STORAGE_KEY) === '1');
        } catch { /* storage unavailable: stay expanded */ }
    }, []);

    const toggle = () => {
        setCollapsed((c) => {
            const next = !c;
            try {
                localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
            } catch { /* ignore */ }
            return next;
        });
    };

    return (
        <div className="min-h-[100dvh]">
            <SideBar collapsed={collapsed} onToggle={toggle} />
            <main
                id="main-content"
                className={`min-h-[100dvh] transition-[padding] duration-700 ease-fluid ${collapsed ? 'md:pl-[100px]' : 'md:pl-[272px]'}`}
            >
                {children}
            </main>
        </div>
    );
}

/** Standard page body: consistent gutter, max width and vertical rhythm. */
export function PageContainer({ children, className = '' }) {
    return (
        <div className={`mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-8 md:py-12 ${className}`}>
            {children}
        </div>
    );
}
