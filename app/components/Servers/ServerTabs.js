'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * The sections of a server's page. One shows at a time, so the page is as long as what you came for, not as long as everything
 * it could say. Left and right arrows move between them; the panel for each is `panelId(id)` (the page renders it).
 * @param {{ id: string, label: string }[]} tabs
 */
export const panelId = (id) => `server-panel-${id}`;
const tabId = (id) => `server-tab-${id}`;

export default function ServerTabs({ tabs, value, onChange, className }) {
    const refs = useRef({});

    const onKeyDown = (event) => {
        const i = tabs.findIndex((t) => t.id === value);
        const next = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        onChange(tabs[next].id);
        refs.current[tabs[next].id]?.focus();
    };

    return (
        <div role="tablist" aria-label="Sections of this server" onKeyDown={onKeyDown} className={cn('flex gap-1 overflow-x-auto border-b border-white/[0.07]', className)}>
            {tabs.map((t) => {
                const active = t.id === value;
                return (
                    <button
                        key={t.id}
                        ref={(el) => { refs.current[t.id] = el; }}
                        type="button"
                        role="tab"
                        id={tabId(t.id)}
                        aria-selected={active}
                        aria-controls={panelId(t.id)}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(t.id)}
                        className={cn(
                            '-mb-px min-h-12 shrink-0 whitespace-nowrap border-b-2 px-4 text-sm font-medium outline-none transition-colors duration-300 ease-fluid focus-visible:ring-2 focus-visible:ring-ring sm:min-h-11',
                            active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
                        )}>
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

export { tabId };
